// ─── /api/tire-search ────────────────────────────────────────────────────────
// Proxy hacia la API pública de VTEX de grupoavante.org.
// Necesitamos este proxy para evitar errores CORS al llamar desde el browser.
// La API de VTEX es pública — no requiere credenciales.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const { q = "", from = 0, to = 5 } = req.query;

  if (!q || q.trim().length < 3) {
    return res.status(400).json({ ok: false, error: "MISSING_QUERY" });
  }

  // Normalizar la medida: "205/55 R16" → "205/55R16" (quitar espacio antes de R)
  const normalized = q.trim().replace(/\s+r/i, "R").replace(/\s+/g, " ");

  const vtexUrl =
    `https://www.grupoavante.org/api/catalog_system/pub/products/search` +
    `?ft=${encodeURIComponent(normalized)}&_from=${from}&_to=${to}`;

  try {
    const vtexRes = await fetch(vtexUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "avante-scanner/1.0",
      },
    });

    if (!vtexRes.ok) {
      console.error(`VTEX API error: ${vtexRes.status}`);
      return res.status(502).json({ ok: false, error: "VTEX_ERROR", status: vtexRes.status });
    }

    const raw = await vtexRes.json();

    // Mapear solo los campos que necesita el frontend
    const products = (Array.isArray(raw) ? raw : [])
      .filter(p => p.items?.length > 0)
      .map(p => {
        const item = p.items[0];
        const offer = item?.sellers?.[0]?.commertialOffer;
        const imageUrl = item?.images?.[0]?.imageUrl || "";

        return {
          id: p.productId,
          name: p.productName,
          brand: p.brand,
          brandImage: p.brandImageUrl || "",
          image: imageUrl.replace(/-#width#-#height#/, "").split("?")[0], // URL limpia
          price: offer?.Price ?? 0,
          listPrice: offer?.ListPrice ?? 0,
          available: offer?.IsAvailable ?? false,
          link: p.link,
          ancho: p["Ancho"]?.[0] ?? "",
          perfil: p["Perfil"]?.[0] ?? "",
          rin: p["Rin"]?.[0] ?? "",
        };
      })
      .filter(p => p.available); // Solo productos en stock

    // Cache: 5 min en CDN, 10 min stale-while-revalidate
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ ok: true, products, query: normalized, total: products.length });

  } catch (err) {
    console.error("tire-search error:", err);
    return res.status(500).json({ ok: false, error: "FETCH_ERROR", message: err.message });
  }
}
