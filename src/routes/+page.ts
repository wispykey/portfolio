import { redirect } from "@sveltejs/kit";

export function load() {
    redirect(308, `${import.meta.env.BASE_URL}/music`)
}