export function random_food(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}
