/* the LAO QR block of the buy page (components/LaoPay.jsx): borrows the look of the buy page's cards; palette tokens only */
export default [`
.by-lao{margin:2.4rem auto 0;max-width:1100px;padding:2rem 1.8rem 1.8rem;}
.lp-steps{margin:.2rem 0 1.4rem 1.2rem;font:400 1rem/1.9 var(--thai);}
.lp-steps li::marker{font-family:var(--anton);color:var(--tartan-red);}
.lp-grid{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:2rem;align-items:start;}
.lp-qr{display:block;width:min(300px,100%);aspect-ratio:1/1;object-fit:contain;background:var(--paper);border:var(--line) solid var(--black);box-shadow:8px 8px 0 var(--black);margin:0 0 1.4rem;}
.lp-amount{border:var(--line) solid var(--black);background:var(--gold);box-shadow:5px 5px 0 var(--black);padding:.8rem 1rem;margin-bottom:1.2rem;display:flex;flex-direction:column;gap:.15rem;}
.lp-amount span{font:400 .8rem var(--type);letter-spacing:.12em;text-transform:uppercase;}
.lp-amount b{font:400 clamp(1.6rem,4vw,2.3rem)/1.1 var(--anton);letter-spacing:.04em;}
.lp-amount small{font:400 .9rem var(--type);}
.lp-no{font:400 1.05rem var(--type);letter-spacing:.06em;word-break:break-all;}
.lp-copy{font-size:.8rem;padding:.35rem .7rem;margin-left:.4rem;}
.lp-h3{font:400 1.3rem/1.4 "Chonburi",var(--thai);margin:0 0 .8rem;}
.lp-err{margin:.6rem 0 0;padding:.6rem .8rem;background:var(--tartan-red);color:var(--paper);border:var(--line) solid var(--black);font:400 .95rem var(--thai);}
.lp-form input[type=file]{padding:.55rem;}
@media(max-width:860px){.lp-grid{grid-template-columns:1fr;}.by-lao{padding:1.4rem 1rem;}}
`];
