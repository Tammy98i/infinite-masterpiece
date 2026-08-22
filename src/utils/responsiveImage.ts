/** Build src/srcSet/sizes for remote images that support width params (e.g. Unsplash). */
export function responsiveImageAttrs(
  url: string,
  opts?: { widths?: number[]; sizes?: string; defaultWidth?: number }
) {
  const widths = opts?.widths || [480, 768, 1200, 1600];
  const sizes = opts?.sizes || '(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px';
  const defaultWidth = opts?.defaultWidth || 800;

  if (!url || !url.includes('images.unsplash.com')) {
    return { src: url, srcSet: undefined as string | undefined, sizes: undefined as string | undefined };
  }

  const withWidth = (w: number) => {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(w));
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    } catch {
      return url;
    }
  };

  return {
    src: withWidth(defaultWidth),
    srcSet: widths.map((w) => `${withWidth(w)} ${w}w`).join(', '),
    sizes,
  };
}
