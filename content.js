/*
 * Single source of truth for the contract address.
 * The page reads it from here; it is never typed anywhere else.
 */
const STARKOJAK_CA = "0x01576Eb581192ad3b05C27836C4b324D89c6814Cc3Ab44F476507D58e6f77c45";

/* StarkLaunchy buy link. Its token address must match STARKOJAK_CA (checked by tools/check-ca.mjs). */
const STARKLAUNCHY_URL = "https://starklaunchy.fun/token/0x1576eb581192ad3b05c27836c4b324d89c6814cc3ab44f476507d58e6f77c45?side=buy";
