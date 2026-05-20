import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Component, ComponentProps } from 'svelte';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
    ref?: E | null;
};

export type WithoutChild<T> = T extends { child?: unknown }
    ? Omit<T, 'child'>
    : T extends { children?: unknown }
    ? Omit<T, 'children'>
    : T;

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;

export type WithoutChildren<T> = T extends { children?: unknown }
    ? Omit<T, 'children'>
    : T;
