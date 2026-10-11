/* homeSvg.js — the inner markup of the home page's line drawings (the loop ring and the three room plans), copied from index.html
   unchanged. They are put in with dangerouslySetInnerHTML, so the DOM stays exactly what it was. */
export const CY_RING = "<circle cx=\"50\" cy=\"50\" r=\"50\"/><path d=\"M-5,-4 L5,0 L-5,4 Z\" transform=\"translate(85.4,14.6) rotate(45)\"/><path d=\"M-5,-4 L5,0 L-5,4 Z\" transform=\"translate(85.4,85.4) rotate(135)\"/><path d=\"M-5,-4 L5,0 L-5,4 Z\" transform=\"translate(14.6,85.4) rotate(225)\"/><path d=\"M-5,-4 L5,0 L-5,4 Z\" transform=\"translate(14.6,14.6) rotate(315)\"/>";
export const ROOMS_SVG = [
 "<path d=\"M8,86 H192\"/><rect x=\"18\" y=\"44\" width=\"40\" height=\"42\"/><rect x=\"70\" y=\"22\" width=\"44\" height=\"64\"/><path d=\"M130,86 V50 a20,20 0 0 1 40,0 V86\"/><circle cx=\"92\" cy=\"54\" r=\"38\" stroke-dasharray=\"4 4\" style=\"stroke:var(--gold)\"/>",
 "<rect x=\"20\" y=\"8\" width=\"160\" height=\"76\"/><path d=\"M80,84 V54 a20,20 0 0 1 40,0 V84\"/><path d=\"M100,92 V30\" stroke-dasharray=\"4 4\" style=\"stroke:var(--gold)\"/><circle cx=\"100\" cy=\"30\" r=\"4\" style=\"stroke:var(--gold)\"/><path d=\"M44,24 H64 M136,24 H156 M44,40 H64 M136,40 H156\"/>",
 "<rect x=\"14\" y=\"28\" width=\"48\" height=\"38\"/><rect x=\"138\" y=\"28\" width=\"48\" height=\"38\"/><path d=\"M62,47 H138\"/><path d=\"M126,38 l12,9 l-12,9\"/><circle cx=\"100\" cy=\"47\" r=\"15\" style=\"stroke:var(--gold)\"/><text x=\"100\" y=\"53\" text-anchor=\"middle\" style=\"fill:var(--gold);stroke:none;font:400 17px Anton,sans-serif\">$</text>"
];
