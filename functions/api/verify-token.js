/*
 * File: /functions/api/verify-token.js
 * API ini adalah "penjaga gerbang" untuk siswa.
 * Ia memeriksa token yang dikirim siswa dengan token di KV.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { token: studentToken } = await request.json();

    if (!studentToken) {
      throw new Error('Token tidak boleh kosong');
    }

    // 1. Cek Saklar Utama (Sistem Aktif?)
    const status = await env.EXAM_KV.get('SYSTEM_STATUS');
    if (status !== 'active') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Sistem ujian sedang tidak aktif.' 
      }), { status: 403 }); // 403 Forbidden
    }

    // 2. Cek Token
    const correctToken = await env.EXAM_KV.get('CURRENT_TOKEN');

    // 3. Bandingkan
    if (studentToken.toUpperCase() === correctToken.toUpperCase()) {
      // BERHASIL!
      return new Response(JSON.stringify({ success: true }));
    } else {
      // GAGAL
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Token yang Anda masukkan salah.' 
      }), { status: 401 }); // 401 Unauthorized
    }

  } catch (e) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: e.message || 'Terjadi error di server' 
    }), { status: 500 });
  }
}