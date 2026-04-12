export const parseSVG = (svgString: string): { path: string; viewBox?: string }[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  const viewBox = svgElement?.getAttribute('viewBox') || undefined;
  
  const paths = Array.from(doc.querySelectorAll('path')).map(p => ({
    path: p.getAttribute('d') || '',
    viewBox
  })).filter(p => p.path);

  return paths;
};
