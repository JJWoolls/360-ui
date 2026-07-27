/* ============================================================================
   @360digilab/ui — the house kit
   ----------------------------------------------------------------------------
   ONE home for the parts both apps are built from. The 360 Workspace app and
   the LMS import from here; neither keeps its own copy. Change a part once and
   both apps get it on their next update.

   Two imports in a consuming app:

     import "@360digilab/ui/tokens.css";          // once, at the app root
     import { Button, Badge } from "@360digilab/ui";

   The tokens file is the paint, the primitives are the parts. An app that wants
   to look different overrides token VALUES; it never forks a component.
   ========================================================================== */

export * from "./primitives";
