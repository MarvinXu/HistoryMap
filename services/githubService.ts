
import { HistoricalEvent, GitHubConfig, UserProfile } from "../types";

const GIST_FILENAME = "history_map_events.json";
const GIST_DESCRIPTION = "历迹 HistoryMap 数据存储";

export const getUserProfile = async (token: string): Promise<UserProfile> => {
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  if (!response.ok) throw new Error("Token 无效或已过期");
  return response.json();
};

export const findOrCreateGist = async (token: string): Promise<string> => {
  // 1. Try to find existing gist
  const listResponse = await fetch("https://api.github.com/gists", {
    headers: { Authorization: `token ${token}` },
  });
  
  if (listResponse.ok) {
    const gists = await listResponse.json();
    const existingGist = gists.find((g: any) => g.description === GIST_DESCRIPTION);
    if (existingGist) return existingGist.id;
  }

  // 2. Not found, create new one
  const createResponse = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify([], null, 2),
        },
      },
    }),
  });

  if (!createResponse.ok) throw new Error("无法创建存储 Gist");
  const newGist = await createResponse.json();
  return newGist.id;
};

export const getGistData = async (config: GitHubConfig): Promise<HistoricalEvent[]> => {
  if (!config.token || !config.gistId) return [];
  
  try {
    const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
      headers: {
        Authorization: `token ${config.token}`,
      },
    });
    
    if (!response.ok) throw new Error("无法获取 Gist 数据");
    
    const gist = await response.json();
    const file = gist.files[GIST_FILENAME];
    if (!file || !file.content) return [];
    
    return JSON.parse(file.content);
  } catch (error) {
    console.error("Error fetching gist:", error);
    return [];
  }
};

export const saveGistData = async (config: GitHubConfig, events: HistoricalEvent[]): Promise<string> => {
  if (!config.token || !config.gistId) throw new Error("未登录或 Gist ID 丢失");

  // Remove isSaved before saving to keep data clean
  const cleanEvents = events.map(({ isSaved, ...rest }) => rest);

  const body = {
    description: GIST_DESCRIPTION,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(cleanEvents, null, 2),
      },
    },
  };

  const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "保存失败");
  }

  const result = await response.json();
  return result.id;
};
