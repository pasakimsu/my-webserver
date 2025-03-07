module.exports = {
  images: {
    domains: ["example.com"], // 필요한 경우 추가
  },
  reactStrictMode: true,
  trailingSlash: true,
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Content-Type",
            value: "image/x-icon",
          },
        ],
      },
    ];
  },
};
