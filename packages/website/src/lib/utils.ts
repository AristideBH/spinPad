// Re-export shared UI helpers so shadcn-svelte components resolve `$lib/utils`.
export {
  cn,
  type WithoutChild,
  type WithoutChildren,
  type WithoutChildrenOrChild,
  type WithElementRef,
} from '$shared/utils';
