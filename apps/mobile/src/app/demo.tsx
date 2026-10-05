import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenDisplay } from "@/display/screen-display";
import { ScreenFrame } from "@/display/screen-frame";
import { demoOptions, useDemoSimulation } from "@/display/use-demo-simulation";

/** The demo screen of "Acme Analytics", simulated on the device: no instance, no account. */
export default function DemoRoute() {
  const router = useRouter();
  const [options] = useState(demoOptions);
  const state = useDemoSimulation(options);
  return (
    <ScreenFrame theme={options.theme} onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
      {({ layout, scale, leading }) => (
        <ScreenDisplay state={state} online layout={layout} scale={scale} leading={leading} />
      )}
    </ScreenFrame>
  );
}
