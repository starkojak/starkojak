/*
 * Every piece of copy on the page lives in this file, together with the contract address and the links.
 * Edit the text here; the layout (index.html, style.css) does not need to change.
 *
 * The four constants below are checked by tools/check-ca.mjs. Keep each on one line, exactly in this form.
 * The contract address is never typed anywhere else.
 */
const STARKOJAK_CA = "0x01576Eb581192ad3b05C27836C4b324D89c6814Cc3Ab44F476507D58e6f77c45";

/* StarkLaunchy buy link. Its token address must match STARKOJAK_CA (checked by tools/check-ca.mjs). */
const STARKLAUNCHY_URL = "https://starklaunchy.fun/token/0x1576eb581192ad3b05c27836c4b324d89c6814cc3ab44f476507d58e6f77c45?side=buy";

const AVNU_URL = "https://app.avnu.fi/en?sellToken=strk&buyToken=starkojak";
const X_URL = "https://x.com/Starkojak";

/* The story is not final: these lines are atmosphere only, never events. */
window.STARK_COPY = {
  skip: "Skip to the story",

  nav: {
    label: "Links",
    brand: "Starkojak",
    avnu: "Buy on Avnu",
    launchy: "Buy on StarkLaunchy",
    buy: "Buy",
    x: "Starkojak on X"
  },

  hero: {
    title: "STARKOJAK",
    line: "The home of STARK, a quiet world waiting to be remembered.",
    avnu: "Buy on Avnu",
    launchy: "Buy on StarkLaunchy",
    x: "Starkojak on X",
    pause: "Pause the film",
    play: "Play the film",
    cue: "Scroll",
    alt: "A stone chapel on a sea cliff at golden hour, seen from the water."
  },

  prologue: {
    tab: "Prologue",
    panels: [
      {
        caption: "Above the bay, a city no one remembers.",
        alt: "A small figure with a star on its head sits on a rock ledge above a wide bay at sunset, drawn in graphite."
      },
      {
        caption: "Sleep is long here, and waking is slow.",
        alt: "Close-up of Starkojak's closed eyes and the pale four-pointed star on the head, drawn in graphite."
      },
      {
        caption: "A mark older than memory.",
        alt: "Extreme close-up of the pale star on Starkojak's dark head."
      },
      {
        caption: "Half awake. Half remembering.",
        alt: "Starkojak glancing sideways with one eye open, a streaked evening sky behind."
      }
    ],
    closing: "Nothing here is lost. Only forgotten."
  },

  turn: {
    tab: "Graphite & colour",
    before: "Every world begins in graphite.",
    after: "Colour comes back the way memory does.",
    alt: "As you scroll, a pencil drawing of the chapel on its cliff turns into the colour painting of the same view.",
    stillAlt: "The chapel on its cliff, half pencil drawing and half colour painting."
  },

  world: {
    tab: "The world",
    items: [
      {
        label: "The coast",
        line: "Across the water, the ruins keep their silence.",
        alt: "The sea, three rock stacks and a ruined castle on an island, seen past the chapel's arched loggia."
      },
      {
        label: "The chapel",
        line: "Light stays longest in the old glass.",
        alt: "The chapel's gable with a round window and a tall stained-glass window glowing amber."
      },
      {
        label: "The stairs",
        line: "Flowers still bloom on the stairs.",
        alt: "Worn stone stairs rising to a dark wooden door, red flowers in terracotta pots."
      },
      {
        label: "The bell",
        line: "Above it all, the bell and the wind.",
        alt: "An open stone belfry with a bronze bell under a slate dome, mountains and sea behind."
      }
    ]
  },

  making: {
    tab: "The making",
    title: "From blockout to final",
    line: "Built in Blender, entirely from code, one stage at a time.",
    stages: ["Blockout", "Architecture", "Materials", "Cliffs", "Painted look", "Vegetation", "Sea and sky", "Final"],
    alts: [
      "The chapel's hero view as a blockout: plain grey clay shapes.",
      "The hero view with the architecture modelled in grey clay.",
      "The hero view with the stone, roof and wood materials added.",
      "The hero view with the cliffs and rocks sculpted under the chapel.",
      "The hero view with the painted look: golden light and soft colour.",
      "The hero view with cypresses, shrubs and grass added.",
      "The hero view with the sea, the distant land and a painted sky.",
      "The final hero view of the chapel on its cliff."
    ]
  },

  token: {
    tab: "Token",
    title: "Starkojak",
    intro: "Starkojak is a meme coin on Starknet.",
    caLabel: "Contract address",
    copy: "Copy",
    copied: "Copied",
    copyLabel: "Copy the contract address",
    note: "Always check the contract address before you swap.",
    avnu: "Buy on Avnu",
    launchy: "Buy on StarkLaunchy",
    x: "Follow on X"
  },

  footer: {
    x: "Follow Starkojak on X",
    disclaimer: "Starkojak is a meme coin with no intrinsic value or expectation of financial return. Nothing on this site is financial advice."
  }
};
