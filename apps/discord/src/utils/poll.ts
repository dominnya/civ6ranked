export async function poll<T>(fetcher: () => Promise<T>, interval = 5000): Promise<T> {
  const response = (await fetcher()) as unknown as { message?: string; summary?: string };

  if (response.message !== 'TASK_STATUS') {
    return response as T;
  }

  if (response.message === 'TASK_STATUS' && !['pending', 'processing'].includes(response.summary!)) {
    return response as T;
  }

  return new Promise(resolve => {
    setTimeout(async () => {
      const result = await poll(fetcher, interval);
      resolve(result as T);
    }, interval);
  });
}
