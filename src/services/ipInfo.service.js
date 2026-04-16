const axios = require('axios');

/**
 * Resolves the city from a client IP using IPinfo.
 * Returns null if the IP is private/loopback or the lookup fails.
 */
const getCityByIP = async (ip) => {
    const isPrivate = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$)/.test(ip);
    if (isPrivate) return null;

    const response = await axios.get(`https://ipinfo.io/${ip}`, {
        params: { token: process.env.IPINFO_TOKEN },
    });

    return response.data.city ?? null;
};

module.exports = { getCityByIP };
