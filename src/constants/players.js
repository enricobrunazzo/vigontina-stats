// constants/players.js

export const PLAYERS = [
  { num: 1, name: "OMAR" },
  { num: 2, name: "BICCIO" },
  { num: 3, name: "LEONARDO" },
  { num: 4, name: "JACOPO" },
  { num: 6, name: "FRANCESCO" },
  { num: 7, name: "ERNAD" },
  { num: 8, name: "VITTORIO" },
  { num: 9, name: "SOMTOCHI" },
  { num: 10, name: "ZANE" },
  { num: 11, name: "ALESSANDRO" },
  { num: 13, name: "PIETRO" },
  { num: 14, name: "PIETRO (CIGNO)" },
  { num: 15, name: "RARES" },
  { num: 16, name: "ARON" },
  { num: 18, name: "SAMUELE" },
];

export const getPlayerByNumber = (num) => {
  return PLAYERS.find((p) => p.num === num);
};

export const getPlayerName = (num) => {
  const player = getPlayerByNumber(num);
  return player?.name || "Sconosciuto";
};