import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const MONGODB_URI = process.env.MONGODB_URI || '';

  if (!MONGODB_URI) {
    return NextResponse.json({
      success: false,
      status: 'No MONGODB_URI configured in environment variables.',
    });
  }

  // Mask credentials in output
  const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ':******@');

  const report: any = {
    configuredUri: maskedUri,
    readyState: mongoose.connection.readyState,
    readyStateDescription: getReadyStateDescription(mongoose.connection.readyState),
    environment: process.env.NODE_ENV,
  };

  try {
    console.log('Attempting diagnostic database connection...');
    
    // Force new connection to capture error details
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    // Run a quick ping command
    const adminDb = conn.connection.db?.admin();
    if (adminDb) {
      const pingResult = await adminDb.ping();
      report.pingResult = pingResult;
      report.success = true;
      report.status = 'Successfully connected and pinged MongoDB Atlas!';
    } else {
      report.success = false;
      report.status = 'Connected but could not access admin DB ping command.';
    }
  } catch (error: any) {
    console.error('Diagnostic DB connection error:', error);
    report.success = false;
    report.status = 'Database connection failed.';
    report.error = {
      name: error.name || 'UnknownError',
      message: error.message || 'No error message provided.',
      code: error.code,
    };

    // Add common solutions for known errors
    if (error.message?.includes('IP') || error.message?.includes('access') || error.message?.includes('whitelist')) {
      report.suggestion = 'This looks like an IP Access List issue. Please log in to MongoDB Atlas, navigate to Security > Network Access, and add IP 0.0.0.0/0 (allow access from anywhere) so Vercel can connect.';
    } else if (error.message?.includes('auth') || error.message?.includes('Authentication failed')) {
      report.suggestion = 'Authentication failed. Please verify that your MongoDB user credentials (username and password) in MONGODB_URI are correct and have not changed.';
    } else {
      report.suggestion = 'Please check that your connection string is formatted correctly and that your MongoDB Atlas cluster is online.';
    }
  }

  return NextResponse.json(report);
}

function getReadyStateDescription(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}
