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

    // 删除旧的 TTL 索引（如果存在）
    try {
      await db.collection(COLLECTIONS.ACTIVE_VISITORS).dropIndex('last_seen_1');
    } catch {
      // 旧索引可能已被删除，忽略错误
    }

    return NextResponse.json({
      ok: true,
      deleted_visitors: delVisitors.deletedCount,
      deleted_logs: delLogs.deletedCount,
      ttl_index_dropped: true,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
