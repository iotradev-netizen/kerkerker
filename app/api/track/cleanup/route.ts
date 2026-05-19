import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { COLLECTIONS } from '@/lib/constants/db';

export async function POST() {
  try {
    const db = await getDatabase();

    const botFilter = {
      $or: [
        { browser: 'Chrome Headless' },
        { os: { $in: ['', null] }, device: { $in: ['', null] }, browser: { $in: ['', null] } },
      ],
    };

    const delVisitors = await db.collection(COLLECTIONS.ACTIVE_VISITORS).deleteMany(botFilter);
    const delLogs = await db.collection(COLLECTIONS.TRACK_PAGE_LOG).deleteMany(botFilter);

    return NextResponse.json({
      ok: true,
      deleted_visitors: delVisitors.deletedCount,
      deleted_logs: delLogs.deletedCount,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
