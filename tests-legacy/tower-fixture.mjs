// A TEST-ONLY patch for artists.js: gives the owner's first two works some process material (idea note, sketch, draft, dates) so the tower
// and the work window can be driven with real stages. It is appended to /artists.js by the test server only; no real page ever sees it.
// The "sketches" are other sample pictures of this repo, standing in for files an artist would upload.
export const FIXTURE_JS = `
;(function () {
  var a = ARTISTS.find(function (x) { return x.id === 'arne'; }); if (!a) return;
  a.pieces[0].idea = 'ดาวแดงบนหน้าคน อยากให้เหมือนโปสเตอร์เก่า'; a.pieces[0].ideaEn = 'A red star on a face, like an old poster.';
  a.pieces[0].sketch = 'art/napha-1.svg'; a.pieces[0].draft = 'art/dao-1.svg';
  a.pieces[0].stages = {idea: '2026-03', sketch: '2026-04-12', draft: '2026-05', final: '2026-06'};
  a.pieces[1].idea = 'ม้าที่มีดาว'; a.pieces[1].sketch = 'art/napha-2.svg';
  a.pieces[1].stages = {idea: '2026-02', sketch: '2026-03'};
})();
`;
