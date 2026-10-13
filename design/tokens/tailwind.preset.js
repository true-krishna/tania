// Pakai: module.exports = { presets: [require("./tokens/tailwind.preset.js")], content: [...] }
// Mirror `tokens/tokens.css` (design constitution v4.3.1): navy = primary
// action; red = brand accent (nav aktif, link, ring fokus, aksi AI); info =
// kategori status informasional; danger token sendiri (bukan alias brand red);
// chart-1..4 = urutan seri data visualisasi kit v1.2.
// Alias Violet v4.0.0 (primary/lilac) di-retire dan tidak dicerminkan di sini.
module.exports = {
  theme: { extend: {
    colors: {
      midnight:'#212121', mist:'#F5F7FA', line:'#DFE1E6', muted:'#5E6C84', neutral:'#6B778C', nav:'#172B4D',
      brand:{ navy:'#172B4D', 'navy-deep':'#0B1F4D', red:'#E1231A', 'red-deep':'#B71C14', 'red-ink':'#B71C14', 'red-tint':'#FCE9E8', 'red-tint-line':'#F5B8B5', 'on-red':'#FFFFFF' },
      info:{ DEFAULT:'#2684FF', tint:'#E9F2FF', ink:'#0B5FD6' },
      chart:{ 1:'#E1231A', 2:'#2684FF', 3:'#168A5B', 4:'#D9822B' },
      mint:{ DEFAULT:'#168A5B', ink:'#0F6E48' }, peach:'#f97066', sun:'#D9822B'
    },
    fontFamily:{ display:['Nunito Sans','system-ui','sans-serif'], sans:['Nunito Sans','system-ui','sans-serif'] },
    borderRadius:{ sm:'10px', md:'14px', lg:'20px', xl:'28px' },
    boxShadow:{ card:'0 1px 2px rgba(16,24,40,.06),0 6px 20px rgba(16,24,40,.06)' }
    // tanpa gradien: bg-mist untuk header, bg-neutral untuk progres
  } }
}
