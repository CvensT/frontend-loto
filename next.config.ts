/** @type {import('next').NextConfig} */
const API = process.env.NEXT_PUBLIC_API_URL || "";

if (!API) {
  console.warn("[next.config.js] NEXT_PUBLIC_API_URL est vide → aucune rewrite /api/* ne sera appliquée.");
}

module.exports = {
  async rewrites() {
    if (!API) return [];
    return [
      { source: "/api/generer",        destination: `${API}/api/generer` },
      { source: "/api/verifier",       destination: `${API}/api/verifier` },
      { source: "/api/verifier-bloc",  destination: `${API}/api/verifier-bloc` },
    ];
  },
};
