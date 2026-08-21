import type { FC, HTMLAttributes } from "react";
import Script from "next/script";

const PLAYER_ID = "vid-6a879897c8b9ec08fa0b6bad";
const PLAYER_SCRIPT =
  "https://scripts.converteai.net/ea6f933a-58f6-43de-ab88-f29019a12a63/players/6a879897c8b9ec08fa0b6bad/v4/player.js";

/** O player da VTurb é um custom element; o cast evita mexer nos tipos globais do JSX. */
const SmartPlayer = "vturb-smartplayer" as unknown as FC<
  HTMLAttributes<HTMLElement> & { id: string }
>;

/**
 * VSL do MPO (VTurb / ConverteAI).
 *
 * O script sobe depois do primeiro paint (afterInteractive) pra não atrasar a
 * headline; o placeholder 16:9 já reserva a altura, então nada pula quando o
 * player monta.
 */
export function VslPlayer({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* React 19 iça esses links pro <head>: DNS/TLS prontos antes do script. */}
      <link rel="preconnect" href="https://scripts.converteai.net" />
      <link rel="preconnect" href="https://cdn.converteai.net" />
      <link rel="preconnect" href="https://images.converteai.net" />
      <link rel="dns-prefetch" href="https://scripts.converteai.net" />

      <div className="relative overflow-hidden rounded-2xl border border-[#20242C] bg-black shadow-[0_30px_90px_-35px_rgba(20,108,255,0.7)]">
        <SmartPlayer
          id={PLAYER_ID}
          style={{ display: "block", margin: "0 auto", width: "100%" }}
        >
          <div
            className="vturb-player-placeholder"
            style={{
              position: "relative",
              width: "100%",
              padding: "56.25% 0 0",
              zIndex: 0,
              backgroundColor: "black",
            }}
          />
        </SmartPlayer>
      </div>

      <Script id="vturb-smartplayer" src={PLAYER_SCRIPT} strategy="afterInteractive" />
    </div>
  );
}
