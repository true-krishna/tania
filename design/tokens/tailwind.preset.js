// Pakai: module.exports = { presets: [require("./tokens/tailwind.preset.js")], content: [...] }
// Mirror `tokens/tokens.css` (design constitution v4.2.0): navy = primary
// action/active nav, red = brand accent. Alias Violet v4.0.0 (primary/lilac)
// di-retire dan tidak dicerminkan di sini.
module.exports = {
  theme: { extend: {
    colors: {
      midnight:'#212121', mist:'#f2f4f7', line:'#d0d5dd', muted:'#667085', neutral:'#667085', nav:'#172B4D',
      brand:{ navy:'#172B4D', 'navy-deep':'#0B1F4D', red:'#E1231A', 'red-deep':'#B71C14' },
      mint:{ DEFAULT:'#168A5B', ink:'#0F6E48' }, peach:'#f97066', sun:'#D9822B'
    },
    fontFamily:{ display:['Nunito Sans','system-ui','sans-serif'], sans:['Nunito Sans','system-ui','sans-serif'] },
    borderRadius:{ sm:'10px', md:'14px', lg:'20px', xl:'28px' },
    boxShadow:{ card:'0 1px 2px rgba(16,24,40,.06),0 6px 20px rgba(16,24,40,.06)' }
    // tanpa gradien: bg-mist untuk header, bg-neutral untuk progres
  } }
}
