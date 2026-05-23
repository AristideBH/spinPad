import { g as getDocBySlug } from "../../../../chunks/index2.js";
import { error } from "@sveltejs/kit";
function load({ params }) {
  const doc = getDocBySlug(params.slug);
  if (!doc) throw error(404, "Page introuvable");
  return { doc };
}
export {
  load
};
