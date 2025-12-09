// ddragon.js
import axios from "axios";

const CDN = "https://ddragon.leagueoflegends.com/cdn";
const META = "https://ddragon.leagueoflegends.com";

let cache = { version: null, champions: null, at: 0 };
const TTL = 1000 * 60 * 60; // 1 hour

export async function getLatestVersion() {
    const { data } = await axios.get(`${META}/api/versions.json`);
    return data[0];
}

export async function getChampionMap(version) {
    const v = version || (await getLatestVersion());
    const { data } = await axios.get(`${CDN}/${v}/data/en_US/champion.json`);
    // data.data is an object keyed by champ id ("Aatrox": {...})
    return { version: v, map: data.data };
}

export async function getChampions(version) {
    const now = Date.now();
    if (cache.champions && now - cache.at < TTL && (!version || version === cache.version)) {
        return { version: cache.version, champions: cache.champions };
    }
    const { version: v, map } = await getChampionMap(version);
    const champions = Object.values(map).map((c) => ({
        key: c.id, // 'Aatrox'
        name: c.name, // 'Aatrox'
        title: c.title,
        tags: c.tags || [], // ['Fighter','Tank']
        iconUrl: `${CDN}/${v}/img/champion/${c.image.full}`, // portrait icon
        splash: `${META}/cdn/img/champion/splash/${c.id}_0.jpg`,
        loading: `${META}/cdn/img/champion/loading/${c.id}_0.jpg`
    }));
    cache = { version: v, champions, at: now };
    return { version: v, champions };
}

const detailCache = new Map(); // key -> { version, champ, at }

export async function getChampionDetails(key, version) {
    const now = Date.now();
    const cacheKey = `${version || "latest"}:${key}`;

    const existing = detailCache.get(cacheKey);
    if (existing && now - existing.at < TTL) {
        return { version: existing.version, champ: existing.champ };
    }

    const v = version || (await getLatestVersion());

    const { data } = await axios.get(`${CDN}/${v}/data/en_US/champion/${key}.json`);

    // Shape: { data: { Aatrox: { ...full champ data... } } }
    const champ = data.data[key] || Object.values(data.data)[0];

    detailCache.set(cacheKey, { version: v, champ, at: now });

    return { version: v, champ };
}
