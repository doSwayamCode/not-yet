import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DATA_DIR = path.join(process.cwd(), '.data');

// Global cache to prevent multiple connections in serverless environment
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (MONGODB_URI) {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      // Silently fall back to local JSON DB – do not log connection details
    }
  }

  // Ensure local data directory exists for JSON DB fallback
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return null;
}

// Fluent Query Builder for Mock Models
class MockQuery<T> {
  private data: T[];
  private sortFn?: (a: T, b: T) => number;
  private skipVal = 0;
  private limitVal?: number;

  constructor(data: T[]) {
    this.data = [...data];
  }

  sort(sortObj: any) {
    if (!sortObj) return this;
    const keys = Object.keys(sortObj);
    if (keys.length === 0) return this;

    this.sortFn = (a: any, b: any) => {
      for (const key of keys) {
        const order = sortObj[key];
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return order === -1 || order === 'desc' ? 1 : -1;
        if (valA > valB) return order === -1 || order === 'desc' ? -1 : 1;
      }
      return 0;
    };
    return this;
  }

  skip(val: number) {
    this.skipVal = val;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  populate(...args: any[]) {
    // Mock populate simply returns self
    return this;
  }

  then(onfulfilled?: (value: T[]) => any, onrejected?: (reason: any) => any) {
    let result = this.data;
    if (this.sortFn) {
      result.sort(this.sortFn);
    }
    if (this.skipVal > 0) {
      result = result.slice(this.skipVal);
    }
    if (this.limitVal !== undefined) {
      result = result.slice(0, this.limitVal);
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }

  async exec(): Promise<T[]> {
    return this.then();
  }
}

// File-based JSON Mock Model
export class MockModel<T extends { _id?: string; createdAt?: string | Date; updatedAt?: string | Date }> {
  private filePath: string;

  constructor(public modelName: string) {
    const dbDir = path.join(DATA_DIR, 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.filePath = path.join(dbDir, `${modelName.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  private readData(): T[] {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content) as T[];
    } catch (e) {
      return [];
    }
  }

  private writeData(data: T[]) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  private match(item: any, filter: any): boolean {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key of Object.keys(filter)) {
      const filterVal = filter[key];
      const itemVal = item[key];

      // Handle operators like $or, $and, regex search, etc.
      if (key === '$or' && Array.isArray(filterVal)) {
        return filterVal.some((subFilter) => this.match(item, subFilter));
      }
      if (key === '$and' && Array.isArray(filterVal)) {
        return filterVal.every((subFilter) => this.match(item, subFilter));
      }

      if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
        // Handle comparison operators
        if (filterVal.$regex) {
          const regex = new RegExp(filterVal.$regex, filterVal.$options || 'i');
          if (!regex.test(String(itemVal || ''))) return false;
          continue;
        }
        if (filterVal.$in && Array.isArray(filterVal.$in)) {
          if (Array.isArray(itemVal)) {
            if (!itemVal.some(val => filterVal.$in.includes(val))) return false;
          } else {
            if (!filterVal.$in.includes(itemVal)) return false;
          }
          continue;
        }
        if (filterVal.$gte !== undefined && itemVal < filterVal.$gte) return false;
        if (filterVal.$lte !== undefined && itemVal > filterVal.$lte) return false;
        if (filterVal.$gt !== undefined && itemVal <= filterVal.$gt) return false;
        if (filterVal.$lt !== undefined && itemVal >= filterVal.$lt) return false;
        if (filterVal.$ne !== undefined && itemVal === filterVal.$ne) return false;
        continue;
      }

      // Exact match
      if (Array.isArray(itemVal)) {
        if (!itemVal.includes(filterVal)) return false;
      } else if (itemVal !== filterVal) {
        return false;
      }
    }
    return true;
  }

  find(filter: any = {}) {
    const allData = this.readData();
    const filtered = allData.filter((item) => this.match(item, filter));
    return new MockQuery<T>(filtered);
  }

  async findOne(filter: any = {}): Promise<T | null> {
    const allData = this.readData();
    const item = allData.find((item) => this.match(item, filter));
    return item || null;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ _id: id });
  }

  async create(data: Partial<T>): Promise<T> {
    const allData = this.readData();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    } as unknown as T;

    allData.push(newDoc);
    this.writeData(allData);
    return newDoc;
  }

  async findByIdAndUpdate(id: string, update: any, options: any = {}): Promise<T | null> {
    const allData = this.readData();
    const index = allData.findIndex((item) => item._id === id);
    if (index === -1) return null;

    const item = allData[index];
    const updatedFields = update.$set || update;
    const incrementFields = update.$inc;

    const updatedDoc = {
      ...item,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    } as any;

    if (incrementFields) {
      for (const key of Object.keys(incrementFields)) {
        updatedDoc[key] = (Number(updatedDoc[key]) || 0) + incrementFields[key];
      }
    }

    // Handle array pushes if applicable
    if (update.$push) {
      for (const key of Object.keys(update.$push)) {
        if (!Array.isArray(updatedDoc[key])) updatedDoc[key] = [];
        const pushVal = update.$push[key];
        if (pushVal && typeof pushVal === 'object' && pushVal.$each) {
          updatedDoc[key].push(...pushVal.$each);
        } else {
          updatedDoc[key].push(pushVal);
        }
      }
    }

    allData[index] = updatedDoc;
    this.writeData(allData);
    return updatedDoc;
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const allData = this.readData();
    return allData.filter((item) => this.match(item, filter)).length;
  }

  async deleteOne(filter: any = {}): Promise<{ deletedCount: number }> {
    const allData = this.readData();
    const initialLength = allData.length;
    const index = allData.findIndex((item) => this.match(item, filter));

    if (index !== -1) {
      allData.splice(index, 1);
      this.writeData(allData);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any = {}): Promise<{ deletedCount: number }> {
    const allData = this.readData();
    const initialLength = allData.length;
    const remaining = allData.filter((item) => !this.match(item, filter));
    this.writeData(remaining);
    return { deletedCount: initialLength - remaining.length };
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    let result = this.readData() as any[];

    for (const stage of pipeline) {
      const stageKey = Object.keys(stage)[0];
      const stageVal = stage[stageKey];

      if (stageKey === '$match') {
        result = result.filter((item) => this.match(item, stageVal));
      } else if (stageKey === '$sort') {
        const keys = Object.keys(stageVal);
        result.sort((a, b) => {
          for (const key of keys) {
            const order = stageVal[key];
            if (a[key] < b[key]) return order === -1 ? 1 : -1;
            if (a[key] > b[key]) return order === -1 ? -1 : 1;
          }
          return 0;
        });
      } else if (stageKey === '$limit') {
        result = result.slice(0, stageVal);
      } else if (stageKey === '$group') {
        const idField = stageVal._id;
        const groupings: Record<string, any> = {};

        for (const item of result) {
          // Resolve group id
          let groupKey = '';
          if (idField === null) {
            groupKey = 'all';
          } else if (typeof idField === 'string' && idField.startsWith('$')) {
            groupKey = String(item[idField.slice(1)] || '');
          } else {
            groupKey = 'other';
          }

          if (!groupings[groupKey]) {
            groupings[groupKey] = { _id: idField === null ? null : groupKey };
            // Initialize accumulators
            for (const field of Object.keys(stageVal)) {
              if (field === '_id') continue;
              const accType = Object.keys(stageVal[field])[0];
              if (accType === '$sum') groupings[groupKey][field] = 0;
              else if (accType === '$avg') groupings[groupKey][field] = { sum: 0, count: 0 };
            }
          }

          const group = groupings[groupKey];
          for (const field of Object.keys(stageVal)) {
            if (field === '_id') continue;
            const accType = Object.keys(stageVal[field])[0];
            const accVal = stageVal[field][accType];

            let val = 0;
            if (typeof accVal === 'number') val = accVal;
            else if (typeof accVal === 'string' && accVal.startsWith('$')) {
              val = Number(item[accVal.slice(1)]) || 0;
            }

            if (accType === '$sum') {
              group[field] += val;
            } else if (accType === '$avg') {
              group[field].sum += val;
              group[field].count += 1;
            }
          }
        }

        // Finalize averages
        result = Object.values(groupings).map((group) => {
          const finalized = { ...group };
          for (const field of Object.keys(stageVal)) {
            if (field === '_id') continue;
            const accType = Object.keys(stageVal[field])[0];
            if (accType === '$avg') {
              const { sum, count } = finalized[field];
              finalized[field] = count > 0 ? sum / count : 0;
            }
          }
          return finalized;
        });
      }
    }

    return result;
  }
}

// Function to resolve model (either Real Mongoose or Local Mock)
export function getModel<T>(name: string, mongooseModel: any): any {
  if (MONGODB_URI) {
    return mongooseModel;
  }
  // Initialize mock model (singleton map)
  if (!(global as any).mockModels) {
    (global as any).mockModels = {};
  }
  if (!(global as any).mockModels[name]) {
    (global as any).mockModels[name] = new MockModel<any>(name);
  }
  return (global as any).mockModels[name];
}
