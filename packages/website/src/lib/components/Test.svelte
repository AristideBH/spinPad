<script lang="ts">
    import {Button} from '$shared/components/ui/button/index.js';
    import { toast } from "svelte-sonner";
</script>


<Button onclick={() =>
    toast("Event has been created", {
      description: "Sunday, December 03, 2023 at 9:00 AM",
      action: {
        label: "Undo",
        onClick: () => console.info("Undo")
      }
    })}
>test</Button>