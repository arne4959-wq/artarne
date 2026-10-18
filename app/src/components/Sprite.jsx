/* the hidden <svg> sprite each old page carried (#orb, #orb-s and the logo gradients); its content is read from that page */
export default function Sprite({svg}) {
  return <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true" dangerouslySetInnerHTML={{__html: svg}}/>;
}
