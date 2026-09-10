<script lang="ts">
  import Map, {
    type MapControlButtonSnippetArg,
    type MapMarker,
    type MapUserLocationSnippetArg,
  } from "$lib/components/Map/Map.svelte";
  import Button from "$lib/components/Button/Button.svelte";

  type PlaceData = {
    kind: "start";
  };

  const markers: MapMarker<PlaceData>[] = [
    { id: "paris", lng: 2.3522, lat: 48.8566, label: "Paris", data: { kind: "start" } },
  ];

  let errorMessage = $state<string | null>(null);

  function handleError(error: Error): void {
    errorMessage = error.message;
  }
</script>

<div class="grid w-full max-w-3xl gap-3">
  <Map
    {markers}
    center={[2.3522, 48.8566]}
    zoom={11}
    controls={["zoom-in", "zoom-out", "geolocate", "reset"]}
    controlPosition="top-right"
    geolocation={{ enabled: false, showMarker: true, zoom: 13 }}
    onError={handleError}
    class="h-[28rem]"
  >
    {#snippet controlButton(button: MapControlButtonSnippetArg)}
      <!-- Click is forwarded by the map's wrapper element, so no onclick here. -->
      <Button
        variant="ghost"
        color={button.action === "geolocate" ? "secondary" : "neutral"}
        size="small"
        class="rounded-none bg-surface/95"
        disabled={button.disabled}
      >
        {button.label}
      </Button>
    {/snippet}

    {#snippet userLocationMarker(location: MapUserLocationSnippetArg)}
      <span
        class="grid size-8 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-contrast shadow-md ring-4 ring-primary/25"
      >
        {Math.round(location.accuracy ?? 0)}m
      </span>
    {/snippet}
  </Map>

  <p class="text-neutral/60 text-sm">
    {#if errorMessage}
      Geolocation did not resolve: {errorMessage}
    {:else}
      Click "Show user location" to trigger the browser permission prompt.
    {/if}
  </p>
</div>
