/*
 * File: /functions/api/verify-token.js
 * VERSI DIPERBARUI:
 * Sekarang jika sukses, ia juga mengambil EXAM_URL dari KV
 * dan mengirimkannya kembali sebagai 'redirectUrl'.
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
      }), { status: 403 });
    }

    // 2. Cek Token
    const correctToken = await env.EXAM_KV.get('CURRENT_TOKEN');
    
    // 3. Bandingkan
    if (studentToken.toUpperCase() === correctToken.toUpperCase()) {
      // --- BERHASIL! ---
      
      // 4. AMBIL URL UJIAN DINAMIS DARI KV
      const examUrl = await env.EXAM_KV.get('EXAM_URL');
      
      if (!examUrl) {
        // Ini terjadi jika admin lupa mengatur URL
        throw new Error('Link Ujian belum diatur oleh Admin.');
      }

      // 5. Kirim 'success' DAN 'redirectUrl'
      return new Response(JSON.stringify({ 
        success: true,
        redirectUrl: examUrl // <- DATA BARU
      }));
      
    } else {
      // --- GAGAL ---
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Token yang Anda masukkan salah.' 
      }), { status: 401 });
    }
    
  } catch (e) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: e.message || 'Terjadi error di server' 
    }), { status: 500 });
  }
}