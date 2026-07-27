/* Side-effect CSS imports. Each primitive imports its own stylesheet so a
   consumer never has to remember which files a component needs — importing the
   component brings its paint with it. The bundler resolves these; TypeScript
   only needs to be told they exist. */
declare module "*.css";
