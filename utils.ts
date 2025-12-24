
/**
 * 从日期字符串中提取年份
 * 支持格式: "YYYY-MM-DD", "YYYY", "-YYYY" (BC)
 */
export const getYearFromDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  // 匹配第一个数字序列，允许负号
  const match = dateStr.match(/^(-?\d+)/);
  return match ? parseInt(match[0]) : 0;
};

/**
 * 将日期字符串解析为可比较的时间戳
 * 支持格式: "YYYY-MM-DD", "YYYY", "-YYYY" (BC)
 */
export const parseDateString = (dateStr: string): number => {
  if (!dateStr) return 0;

  // 处理公元前日期
  if (dateStr.startsWith('-')) {
    const year = parseInt(dateStr.slice(1));
    // 公元前1年对应0，公元前2年对应-1，以此类推
    return -year;
  }

  try {
    // 尝试解析为完整日期
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  } catch (e) {
    // 解析失败，尝试只解析年份
    const yearMatch = dateStr.match(/^(\d+)/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      // 假设是当年的1月1日
      return new Date(year, 0, 1).getTime();
    }
  }

  return 0;
};

/**
 * 比较两个日期字符串
 * @returns 负数如果a在b之前，正数如果a在b之后，0如果相等
 */
export const compareDateStrings = (a: string, b: string): number => {
  return parseDateString(a) - parseDateString(b);
};