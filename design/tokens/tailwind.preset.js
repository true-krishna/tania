// Pakai: module.exports = { presets: [require("./tokens/tailwind.preset.js")], content: [...] }
module.exports = {
  theme: { extend: {
    colors: {
      midnight:'#212121', mist:'#f2f4f7', line:'#d0d5dd', muted:'#667085', neutral:'#667085', nav:'#491c96',
      primary:{ DEFAULT:'#875bf7', deep:'#7839ee' }, lilac:'#c3b5fd',
      mint:{ DEFAULT:'#12b76a', ink:'#027a48' }, peach:'#f97066', sun:'#fec84b'
    },
    fontFamily:{ display:['Nunito Sans','system-ui','sans-serif'], sans:['Nunito Sans','system-ui','sans-serif'] },
    borderRadius:{ sm:'10px', md:'14px', lg:'20px', xl:'28px' },
    boxShadow:{ card:'0 1px 2px rgba(16,24,40,.06), 0 6px 20px rgba(16,24,40,.06)' }
    // tanpa gradien: bg-mist untuk header, bg-neutral untuk progres
  } }
}
