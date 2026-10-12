/*
 * BOOK CONTENT
 * Edit the text of the book here. Nothing else needs to change.
 *
 * Page types:
 *   contents : table of contents  — entries: [{ label, page }]  (page = inner page number)
 *   text     : prose page         — paragraphs, optional drawing ("starChart" | "castle" | "compass"), note
 *   drawing  : illustration page  — drawing, caption, notes (handwritten)
 *   photo    : pasted photograph  — photo (image path, or "" for a generated placeholder), caption
 *   list     : list page          — intro, items, optional drawing
 *   notes    : handwritten page   — paragraphs, lines (handwritten)
 *   contact  : correspondence     — paragraphs, links: [{ label, value, href }], signature
 *
 * Keep each page short: it has to fit on one page of the book, also on phones.
 * The book needs exactly 8 inner pages to close neatly on its back cover.
 */
const BOOK = {
  cover: {
    title: "Starkojak",
    subtitle: "Being a Record of the Work",
    volume: "Volume I",
    hint: "Click the cover to open"
  },

  backCover: {
    motto: "Finis"
  },

  pages: [
    {
      type: "contents",
      title: "Contents",
      entries: [
        { label: "Preface", page: 2 },
        { label: "A Chart of the Sky", page: 3 },
        { label: "The Road So Far", page: 4 },
        { label: "From the Archive", page: 5 },
        { label: "What Lies Within", page: 6 },
        { label: "Margin Notes", page: 7 },
        { label: "Correspondence", page: 8 }
      ],
      note: "Begin anywhere. The pages will forgive you."
    },
    {
      type: "text",
      title: "Preface",
      paragraphs: [
        "This book keeps the story of Starkojak: how it began, what it has become, and where it means to go next. It is written plainly, for anyone who happens to wander in.",
        "Each page holds one part of the tale. Read them in order, or open at random. The work was never built in a straight line either."
      ],
      note: "Begun on a rainy evening. Still unfinished."
    },
    {
      type: "drawing",
      title: "A Chart of the Sky",
      drawing: "starChart",
      caption: "Fig. I. The first map: every idea plotted, most of them never visited.",
      notes: ["the bright one is the idea that stuck", "north is wherever the work points"]
    },
    {
      type: "text",
      title: "The Road So Far",
      paragraphs: [
        "It started as a small experiment, the kind one abandons by the weekend. It was not abandoned.",
        "There were wrong turns and long nights, and a few mornings when everything simply worked. Each of them left a mark on these pages."
      ],
      drawing: "castle",
      note: "the keep we set out to build"
    },
    {
      type: "photo",
      title: "From the Archive",
      photo: "",
      caption: "The first day, more or less. Paste your own photograph here."
    },
    {
      type: "list",
      title: "What Lies Within",
      intro: "Four promises, kept as well as we are able:",
      items: [
        "A clear purpose: one problem, solved with care.",
        "Sturdy foundations, built to outlast the first version.",
        "An open door. Anyone may read, borrow and improve.",
        "A steady hand. Maintained, not merely launched."
      ],
      drawing: "compass"
    },
    {
      type: "notes",
      title: "Margin Notes",
      paragraphs: [
        "A working book keeps one page for unfinished thoughts. This is that page."
      ],
      lines: [
        "Still to do:",
        "finish the second chapter",
        "draw a better map",
        "ask for honest feedback",
        "keep the pages turning"
      ]
    },
    {
      type: "contact",
      title: "Correspondence",
      paragraphs: [
        "Letters, questions and kind words are always welcome. Write by any of the roads below."
      ],
      links: [
        { label: "GitHub", value: "github.com/starkojak", href: "https://github.com/starkojak" },
        { label: "Website", value: "starkojak.vercel.app", href: "https://starkojak.vercel.app" },
        { label: "Post", value: "your@email.here", href: "" }
      ],
      signature: "Yours, in ink — Starkojak"
    }
  ]
};
