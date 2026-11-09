const PAGE_SIZE = 1000;

type Page<T> = {
  data: T[] | null;
  error: unknown;
};

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<Page<T>>,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    // Supabase returns at most 1000 rows per query, so keep paging until a short page.
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}
