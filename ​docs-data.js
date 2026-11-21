// ============================================================================
// Exoscript Documentation Data, Syntax Highlighter & Reusable UI Components
// ============================================================================

const CODE_SNIPPETS = {};
let snippetCounter = 0;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightPython(code) {
  const escaped = escapeHtml(code);
  const tokenRegex =
    /(#[^\n]*)|(&quot;(?:\\.|[^&]|&(?!quot;))*&quot;|&#39;(?:\\.|[^&]|&(?!#39;))*&#39;|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[a-zA-Z_][a-zA-Z0-9_.]*)|\b(import|from|as|def|return|if|else|elif|for|in|while|with|class|pass|and|or|not)\b|\b(True|False|None)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g;

  return escaped.replace(tokenRegex, (match, com, str, dec, kw, bool, num, fn) => {
    if (com) return `<span class="tok-com">${com}</span>`;
    if (str) return `<span class="tok-str">${str}</span>`;
    if (dec) return `<span class="tok-dec">${dec}</span>`;
    if (kw) return `<span class="tok-kw">${kw}</span>`;
    if (bool) return `<span class="tok-bool">${bool}</span>`;
    if (num) return `<span class="tok-num">${num}</span>`;
    if (fn) return `<span class="tok-fn">${fn}</span>`;
    return match;
  });
}

function ic(text) {
  return `<code class="rounded-md bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/70 dark:border-zinc-700/70 px-1.5 py-0.5 font-mono text-[13px] text-sky-700 dark:text-sky-300">${escapeHtml(text)}</code>`;
}

function codeBlock(code, lang = 'python', filename = '') {
  const id = `snippet_${++snippetCounter}`;
  CODE_SNIPPETS[id] = code;
  const formatted = lang === 'python' ? highlightPython(code) : escapeHtml(code);

  return `
    <div class="group relative my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111114] overflow-hidden shadow-xs">
      <div class="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/60 px-4 py-2">
        <span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">${escapeHtml(filename || lang)}</span>
        <button
          type="button"
          data-copy-id="${id}"
          class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-sky-500/50 hover:text-zinc-900 dark:hover:text-white transition-all"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span class="copy-label">Copy</span>
        </button>
      </div>
      <pre class="overflow-x-auto p-4 text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200"><code>${formatted}</code></pre>
    </div>
  `;
}

function callout(title, bodyHtml, tone = 'info') {
  const tones = {
    info: {
      wrap: 'border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10',
      title: 'text-sky-700 dark:text-sky-300',
    },
    tip: {
      wrap: 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10',
      title: 'text-emerald-700 dark:text-emerald-300',
    },
    warn: {
      wrap: 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10',
      title: 'text-amber-700 dark:text-amber-300',
    },
  };
  const style = tones[tone] || tones.info;

  return `
    <div class="my-5 rounded-xl border ${style.wrap} p-4">
      <div class="text-sm font-semibold ${style.title} mb-1">${escapeHtml(title)}</div>
      <div class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">${bodyHtml}</div>
    </div>
  `;
}

// ============================================================================
// Exoscript Action Tabs (Used on the Exoscripts Page)
// ============================================================================
const ACTION_TABS = [
  {
    id: 'flow',
    label: 'Control Flow',
    items: [
      { sig: '.wait(sec)', desc: 'Pause the Exoscript for a number of seconds.' },
      { sig: '.wait_frames(n)', desc: 'Pause for an exact number of frames.' },
      { sig: '.repeat(n, body)', desc: 'Run an exoscript.block() a fixed number of times.' },
      { sig: '.repeat_while(cond, body)', desc: 'Loop a block while a condition stays true.' },
      { sig: '.if_else(cond, if_body, else_body)', desc: 'Branch logic based on a condition (else_body is optional).' },
    ],
  },
  {
    id: 'transforms',
    label: 'Transforms',
    items: [
      { sig: '.move(target, pos, ...)', desc: 'Move an object or set to (x, y). Supports is_global, duration, easing, and wait.' },
      { sig: '.scale(target, sc, ...)', desc: 'Resize an object or set to (sx, sy) over an optional duration.' },
      { sig: '.rotate(target, rot, ...)', desc: 'Rotate an object in degrees. Supports shortest_path, is_global, duration, easing, and wait.' },
    ],
  },
  {
    id: 'visuals_camera',
    label: 'Visuals & Camera',
    items: [
      { sig: '.set_color(target, color, ...)', desc: 'Change an object color (hex or RGBA) on a channel with optional fade duration.' },
      { sig: '.set_text(target, text)', desc: 'Update the displayed text on a text object.' },
      { sig: '.set_enabled(target, enabled)', desc: 'Enable or disable an object or object set.' },
      { sig: '.game_text(text, duration)', desc: 'Show an on-screen banner message to the player.' },
      { sig: '.camera_pan(pos, ...)', desc: 'Pan the camera to a world position with optional duration, easing, and wait.' },
      { sig: '.camera_zoom(size, ...)', desc: 'Change the camera viewport size to zoom in or out.' },
      { sig: '.camera_shake(...)', desc: 'Trigger camera shake (strength, roughness, fade_in, fade_out, duration, wait).' },
    ],
  },
  {
    id: 'vars_gameplay',
    label: 'Variables & Gameplay',
    items: [
      { sig: '.set_var(var, val)', desc: 'Assign a new value or expression result to an exovar variable.' },
      { sig: '.reset_var(var)', desc: 'Reset a variable back to its starting value.' },
      { sig: '.activate(target)', desc: 'Activate a target object or trigger.' },
      { sig: '.deactivate(target)', desc: 'Deactivate a target object.' },
      { sig: '.kill(target)', desc: 'Kill the target (for example, exovar.player()).' },
      { sig: '.game_finish()', desc: 'Immediately finish the level run.' },
      { sig: '.call(fn, *args)', desc: 'Call a reusable @exoscript.func or stdlib effect.' },
      { sig: '.call_id(id, params)', desc: 'Call another Exoscript directly by its numeric script ID.' },
      { sig: '.ret(val)', desc: 'Return a value from inside a reusable function.' },
      { sig: '.raw_action(id, *fields)', desc: 'Emit a low-level Exoscript action directly by Action ID.' },
    ],
  },
];

let activeActionTab = 'flow';

function renderActionTabsHtml() {
  const buttons = ACTION_TABS.map((t) => {
    const isActive = t.id === activeActionTab;
    const cls = isActive
      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/40'
      : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200';
    return `<button type="button" data-action-tab="${t.id}" class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${cls}">${escapeHtml(t.label)}</button>`;
  }).join('');

  const current = ACTION_TABS.find((t) => t.id === activeActionTab) || ACTION_TABS[0];
  const rows = current.items
    .map(
      (item) => `
      <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3">
        <div class="sm:w-64 shrink-0 font-mono text-xs font-medium text-sky-700 dark:text-sky-400">${escapeHtml(item.sig)}</div>
        <div class="text-sm text-zinc-600 dark:text-zinc-300">${escapeHtml(item.desc)}</div>
      </div>
    `
    )
    .join('');

  return `
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">${buttons}</div>
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] px-4 divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
        ${rows}
      </div>
    </div>
  `;
}

// ============================================================================
// Documentation Pages (8 Focused Pages)
// ============================================================================
const DOC_PAGES = [
  {
    id: 'quickstart',
    group: 'Getting Started',
    title: 'Quick Start',
    description: 'Install exopython and export your first playable Exoracer level.',
    keywords: ['install', 'pip', 'exopython', 'init', 'CreateObj', 'export', 'import', 'exoracer', 'exoscript'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Getting Started</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Quick Start</h1>
        <p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Build Exoracer levels and Exoscripts in Python instead of clicking around the editor for hours.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">1. Install</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Install ${ic('exopython')} from PyPI:
        </p>
        ${codeBlock('pip install exopython', 'bash', 'terminal')}
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          In Python, import the package as ${ic('import exopy as exo')}.
        </p>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">2. Build Your First Level</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Save this code as ${ic('level.py')} and run it:
        </p>
        ${codeBlock(`import exopy as exo

lvl = exo.init(
    "My First Level",
    bg_type="Mountains",
    laps=1,
    gravity=(0.0, -74.0),
    settings={
        "AuthorTime": 12.5,
        "Gold": 15.0,
        "Silver": 20.0,
        "Private": False,
    },
)

exo.CreateObj("terrain", (0, -2)).settings({"Box": (40, 2)}).pack()
exo.CreateObj("start", (-15, 0)).pack()
exo.CreateObj("finish", (15, 0)).pack()

lvl.export("my_level.exolvl")`, 'python', 'level.py')}
      </section>

      ${callout(
        'Import the level into Exoracer',
        'Run the script to generate <code>my_level.exolvl</code>, import the level into Exoracer, and play. Want to try writing code right in your browser? Open the <button type="button" data-nav="playground" class="underline font-medium text-emerald-700 dark:text-emerald-300 hover:opacity-80">Playground &amp; Preview</button>.',
        'tip'
      )}
    `,
  },

  {
    id: 'levels',
    group: 'Core API',
    title: 'Levels & Settings',
    description: 'Configure themes, laps, gravity, medal times, custom background color, and export options.',
    keywords: ['exo.init', 'bg_type', 'Mountains', 'Halloween', 'Christmas', 'Custom', 'laps', 'gravity', 'AuthorTime', 'Gold', 'Silver', 'CustomBackgroundColor', 'music', 'Obfuscate', 'UUID', 'export', 'compress', 'metadata_mode'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Core API</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Levels & Settings</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Start every level with ${ic('exo.init()')} and export it with ${ic('lvl.export()')}.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Initializing a Level</h2>
        ${codeBlock(`lvl = exo.init(
    name,
    bg_type="Mountains",
    laps=1,
    gravity=(0.0, -74.0),
    settings=None,
)`, 'python', 'signature')}

        <div class="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table class="w-full text-left text-sm border-collapse">
            <thead class="bg-zinc-50 dark:bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th class="px-4 py-3 font-semibold">Parameter</th>
                <th class="px-4 py-3 font-semibold">Default</th>
                <th class="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200/70 dark:divide-zinc-800/70 bg-white dark:bg-[#111114]">
              <tr>
                <td class="px-4 py-3 font-mono text-xs text-sky-700 dark:text-sky-400">name</td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-500">required</td>
                <td class="px-4 py-3 text-zinc-600 dark:text-zinc-300">Level title displayed in Exoracer.</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-xs text-sky-700 dark:text-sky-400">bg_type</td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-500">"Mountains"</td>
                <td class="px-4 py-3 text-zinc-600 dark:text-zinc-300">Choose ${ic('"Mountains"')}, ${ic('"Halloween"')}, ${ic('"Christmas"')}, or ${ic('"Custom"')}.</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-xs text-sky-700 dark:text-sky-400">laps</td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-500">1</td>
                <td class="px-4 py-3 text-zinc-600 dark:text-zinc-300">Number of laps from ${ic('1')} to ${ic('10')}.</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-xs text-sky-700 dark:text-sky-400">gravity</td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-500">(0.0, -74.0)</td>
                <td class="px-4 py-3 text-zinc-600 dark:text-zinc-300">2D gravity vector ${ic('(gx, gy)')}. Default is ${ic('(0.0, -74.0)')}.</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-xs text-sky-700 dark:text-sky-400">settings</td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-500">None</td>
                <td class="px-4 py-3 text-zinc-600 dark:text-zinc-300">Optional dictionary of extra level settings.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Common <span class="font-mono text-lg">settings</span> Keys</h2>
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] divide-y divide-zinc-200/70 dark:divide-zinc-800/70 px-4">
          <div class="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div class="sm:w-56 shrink-0 font-mono text-xs text-sky-700 dark:text-sky-400">AuthorTime, Gold, Silver</div>
            <div class="text-sm text-zinc-600 dark:text-zinc-300">Medal times in seconds (${ic('float')}).</div>
          </div>
          <div class="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div class="sm:w-56 shrink-0 font-mono text-xs text-sky-700 dark:text-sky-400">Private, CenterCamera, AllowDirectionChange, DisableReplays, DisableRevivePads, DisableStartAnim</div>
            <div class="text-sm text-zinc-600 dark:text-zinc-300">Boolean switches (${ic('True')} or ${ic('False')}) for camera and gameplay rules.</div>
          </div>
          <div class="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div class="sm:w-56 shrink-0 font-mono text-xs text-sky-700 dark:text-sky-400">CustomBackgroundColor</div>
            <div class="text-sm text-zinc-600 dark:text-zinc-300">A single solid background color as a hex string like ${ic('"#101820"')}.</div>
          </div>
          <div class="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div class="sm:w-56 shrink-0 font-mono text-xs text-sky-700 dark:text-sky-400">music</div>
            <div class="text-sm text-zinc-600 dark:text-zinc-300">A single track name string or a list of track names.</div>
          </div>
          <div class="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div class="sm:w-56 shrink-0 font-mono text-xs text-sky-700 dark:text-sky-400">Obfuscate</div>
            <div class="text-sm text-zinc-600 dark:text-zinc-300">Boolean. Set to ${ic('True')} to scramble Exoscript, parameter, and variable names on export.</div>
          </div>
          <div class="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <div class="sm:w-56 shrink-0 font-mono text-xs text-sky-700 dark:text-sky-400">UUID</div>
            <div class="text-sm text-zinc-600 dark:text-zinc-300">Custom level UUID string (auto-generated if omitted).</div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Exporting Your Level</h2>
        ${codeBlock(`lvl.export(
    filepath,
    compress=True,
    obfuscate=None,
    metadata_mode="footer",
    generator_mode=None,
    include_meta=False,
)`, 'python', 'signature')}
        <ul class="list-disc pl-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li>${ic('compress=True')} — gzip-compresses the ${ic('.exolvl')} file so you can import the level into Exoracer directly.</li>
          <li>${ic('obfuscate=None')} — overrides the level's ${ic('Obfuscate')} setting when set to ${ic('True')} or ${ic('False')}.</li>
          <li>${ic('metadata_mode="footer"')} — writes metadata into the binary footer (or ${ic('"object"')} to store it in a hidden text object).</li>
          <li>${ic('generator_mode')} & ${ic('include_meta')} — returns a summary dictionary (object/script counts and UUID) instead of just the file path.</li>
        </ul>
      </section>
    `,
  },

  {
    id: 'objects',
    group: 'Core API',
    title: 'Objects & Layers',
    description: 'Place terrain, start/finish gates, text, and custom objects, and organize them onto parallax layers.',
    keywords: ['CreateObj', 'CreateLayer', 'settings', 'pack', 'Rotation', 'Scale', 'Tag', 'Layer', 'Box', 'TerrainCorners', 'parallax', 'tile_id'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Core API</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Objects & Layers</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Place objects with ${ic('exo.CreateObj()')}, tweak their properties with ${ic('.settings()')}, and add them to your level with ${ic('.pack()')}.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Creating Objects</h2>
        ${codeBlock(`box = exo.CreateObj("terrain", (0, 0)).settings({
    "Box": (10, 2),
    "Rotation": 15.0,
    "Scale": (1.0, 1.0),
    "Tag": "ramp",
}).pack()`, 'python', 'objects.py')}

        <div class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <p>
            <strong>${ic('obj_type')}</strong> accepts either a friendly name like ${ic('"terrain"')}, ${ic('"start"')}, ${ic('"finish"')}, or ${ic('"text"')}, or a raw integer ${ic('tile_id')}.
          </p>
          <p>
            <strong>${ic('.settings({...})')}</strong> accepts transform shortcuts and any valid Exoracer object property:
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-3.5">
            <div class="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">Box</div>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">Tuple ${ic('(width, height)')}. Automatically generates ${ic('TerrainCorners')} for rectangular terrain.</p>
          </div>
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-3.5">
            <div class="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">Rotation & Scale</div>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">${ic('Rotation')} is a float in degrees; ${ic('Scale')} is a ${ic('(sx, sy)')} tuple.</p>
          </div>
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-3.5">
            <div class="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">Tag & Layer</div>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">Attach a string tag for Exoscripts, or assign a ${ic('Layer')} object (or layer ID).</p>
          </div>
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-3.5">
            <div class="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">Exoracer Properties</div>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">Pass object-specific keys like ${ic('Text')}, ${ic('FontSize')}, or ${ic('Color')} directly.</p>
          </div>
        </div>

        ${callout(
          'Always call .pack()',
          `An object is not added to your level until you call ${ic('.pack()')} at the end. ${ic('.pack()')} also returns the object itself so you can save it in a Python variable and animate it with Exoscripts.`,
          'warn'
        )}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Layers & Parallax</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Create extra layers with ${ic('exo.CreateLayer(name, foreground_type=0, parallax=(0.0, 0.0))')} and assign objects with ${ic('{"Layer": bg}')}:
        </p>
        ${codeBlock(`bg = exo.CreateLayer("Background", foreground_type=0, parallax=(0.5, 0.5))

exo.CreateObj("text", (0, 6)).settings({
    "Text": "Welcome!",
    "FontSize": 4.0,
    "Layer": bg,
}).pack()`, 'python', 'layers.py')}
      </section>
    `,
  },

  {
    id: 'variables',
    group: 'Scripting',
    title: 'Variables (exovar)',
    description: 'Typed global/local variables, math operators, and live game value helpers.',
    keywords: ['exovar', 'variables', 'Int', 'Float', 'Bool', 'String', 'Color', 'Vector', 'Object', 'ObjectSet', 'player', 'players', 'tag', 'object_set', 'obj_pos', 'obj_global_pos', 'distance', 'pointer_world_pos', 'pointer_down', 'pointer_held', 'not_', 'and_', 'or_', 'to_str', 'concat', 'random_int'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Scripting</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Variables (<span class="font-mono text-2xl sm:text-3xl">exovar</span>)</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Import the variables module as ${ic('exovar')} to create typed level variables and live expressions.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Variable Types</h2>
        ${codeBlock(`from exopy import variables as exovar

score  = exovar.Int("score", 0)
speed  = exovar.Float("speed", 1.5)
active = exovar.Bool("active", True)
label  = exovar.String("label", "GO!")
tint   = exovar.Color("tint", "#FF0055")
offset = exovar.Vector("offset", (0.0, 5.0))
target = exovar.Object("target", box)
group  = exovar.ObjectSet("group", [box])`, 'python', 'variables.py')}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Math & Comparisons</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Use standard Python math and comparison operators directly on ${ic('exovar')} variables and parameters:
        </p>
        <div class="flex flex-wrap gap-2">
          ${['+', '-', '*', '/', '<', '<=', '>', '>=', '.eq(other)', '.ne(other)']
            .map((op) => `<span class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 font-mono text-xs text-sky-700 dark:text-sky-400">${escapeHtml(op)}</span>`)
            .join('')}
        </div>
        ${codeBlock(`next_score = score + 1
is_fast = speed >= 2.0
is_ready = active.eq(True)`, 'python', 'expressions.py')}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Live Game Value Helpers</h2>
        <div class="grid grid-cols-1 gap-4">
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-2">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">Targets</h3>
            <div class="flex flex-wrap gap-2">
              ${['exovar.player()', 'exovar.players()', 'exovar.tag("ramp")', 'exovar.object_set([...])'].map(ic).join('')}
            </div>
          </div>

          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-2">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">Positions & Input</h3>
            <div class="flex flex-wrap gap-2">
              ${[
                'exovar.obj_pos(obj)',
                'exovar.obj_global_pos(obj)',
                'exovar.distance(a, b)',
                'exovar.pointer_world_pos()',
                'exovar.pointer_down()',
                'exovar.pointer_held()',
              ].map(ic).join('')}
            </div>
          </div>

          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-2">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">Logic & Text</h3>
            <div class="flex flex-wrap gap-2">
              ${[
                'exovar.not_(c)',
                'exovar.and_(a, b)',
                'exovar.or_(a, b)',
                'exovar.to_str(x)',
                'exovar.concat(a, b)',
                'exovar.random_int(lo, hi)',
              ].map(ic).join('')}
            </div>
          </div>
        </div>
      </section>
    `,
  },

  {
    id: 'scripts',
    group: 'Scripting',
    title: 'Exoscripts (exoscript)',
    description: 'Store Exoscripts and action blocks in Python variables, build @exoscript.func helpers, and browse all actions.',
    keywords: ['exoscript', 'Exoscripts', 'scripts', 'create', 'block', 'variable', 'store', 'func', 'repeat', 'move', 'scale', 'rotate', 'camera_pan', 'camera_zoom', 'camera_shake', 'set_var', 'set_color', 'game_text', 'kill', 'game_finish', 'wait', 'if_else'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Scripting</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Exoscripts (<span class="font-mono text-2xl sm:text-3xl">exoscript</span>)</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Write Exoscripts by chaining actions together in Python. Import the modules as ${ic('exoscript')} and ${ic('exovar')}.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Storing Exoscripts in Python Variables</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Both ${ic('exoscript.block()')} action sequences and ${ic('exoscript.create(...)')} script objects are regular Python objects. You can store them in Python variables, add more steps later, reuse the same action block across multiple scripts, and call ${ic('.pack()')} whenever you're ready:
        </p>
        ${codeBlock(`from exopy import scripts as exoscript, variables as exovar

platform = exo.CreateObj("terrain", (0, 2)).settings({"Box": (6, 1)}).pack()
count = exovar.Int("count", 0)

# 1. Store an action block inside a Python variable
move_seq = (
    exoscript.block()
    .move(platform, (10, 2), duration=1.0, wait=True)
    .move(platform, (0, 2), duration=1.0, wait=True)
    .set_var(count, count + 1)
)

# 2. Store the Exoscript itself inside a Python variable, add actions, then pack()
mover = exoscript.create("MovingPlatform").on(0)
mover.repeat(5, move_seq)
mover.game_text("Done!", duration=2.0)
mover.pack()`, 'python', 'stored_exoscripts.py')}

        ${callout(
          'Compose scripts cleanly with Python',
          `Storing an Exoscript in a Python variable like ${ic('mover')} lets you build complex scripts across multiple lines, loop over objects with a Python ${ic('for')} loop, or pass the script into helper functions before calling ${ic('mover.pack()')}.`,
          'tip'
        )}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Reusable Functions (<span class="font-mono text-lg">@exoscript.func</span>)</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Decorate any Python function that returns an ${ic('exoscript.block()')} with ${ic('@exoscript.func')} to call it from any Exoscript:
        </p>
        ${codeBlock(`@exoscript.func(name="boost_alert")
def boost_alert(msg: exovar.String):
    return (
        exoscript.block()
        .camera_shake(strength=0.6, duration=0.2)
        .game_text(msg, duration=1.5)
    )

on_start = exoscript.create("OnStart").on(0).call(boost_alert, "Go!").pack()`, 'python', 'functions.py')}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Action Reference</h2>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          Pick a category to view all available chainable Exoscript actions:
        </p>
        <div id="action-tabs-container">
          ${renderActionTabsHtml()}
        </div>
      </section>
    `,
  },

  {
    id: 'stdlib',
    group: 'Scripting',
    title: 'Built-In Effects (stdlib)',
    description: 'Pre-built, cached Exoscript effects ready to call in your scripts.',
    keywords: ['stdlib', 'flash', 'pulse', 'glide_between', 'banner', 'effects', 'exoscript'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Scripting</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Built-In Effects (<span class="font-mono text-2xl sm:text-3xl">stdlib</span>)</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          ${ic('exo.stdlib')} gives you ready-to-use Exoscript effects that are cached automatically per level so you don't duplicate script code.
        </p>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-1.5">
          <div class="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">exo.stdlib.flash()</div>
          <p class="text-sm text-zinc-600 dark:text-zinc-300">Briefly flashes objects to a highlight color and back.</p>
        </div>
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-1.5">
          <div class="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">exo.stdlib.pulse()</div>
          <p class="text-sm text-zinc-600 dark:text-zinc-300">Pops objects bigger, then scales them back to normal.</p>
        </div>
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-1.5">
          <div class="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">exo.stdlib.glide_between()</div>
          <p class="text-sm text-zinc-600 dark:text-zinc-300">Slides objects smoothly back and forth between two points.</p>
        </div>
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-4 space-y-1.5">
          <div class="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">exo.stdlib.banner()</div>
          <p class="text-sm text-zinc-600 dark:text-zinc-300">Shows a timed on-screen message to the player.</p>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Using a stdlib Effect</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Store the stdlib helper in a Python variable and call it inside your Exoscript with ${ic('.call()')}:
        </p>
        ${codeBlock(`import exopy as exo
from exopy import scripts as exoscript

lvl = exo.init("Flash Demo", gravity=(0.0, -74.0))
pad = exo.CreateObj("terrain", (0, 0)).settings({"Box": (8, 1)}).pack()

flash_fn = exo.stdlib.flash()
banner_fn = exo.stdlib.banner()

intro_fx = (
    exoscript.create("IntroFX")
    .on(0)
    .call(banner_fn, "Ready!", 1.5)
    .call(flash_fn, pad, "#00E5FF", "#FFFFFF", 0.25)
    .pack()
)

lvl.export("flash_demo.exolvl")`, 'python', 'stdlib_demo.py')}
      </section>
    `,
  },

  {
    id: 'decompile',
    group: 'Tools & Security',
    title: 'Decompile & Protect',
    description: 'Convert .exolvl files back into Python and protect your Exoscripts with owner keys.',
    keywords: ['decompile', 'obfuscate', 'exopy_keys', 'sha256', 'protect', 'security', 'key', 'hash'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Tools & Security</div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Decompile & Protect</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Turn existing ${ic('.exolvl')} files back into editable Python code, or lock down your own Exoscripts before sharing.
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Decompiling a Level</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Pass any ${ic('.exolvl')} file to ${ic('exo.decompile()')} to generate a clean Python script you can edit and re-export:
        </p>
        ${codeBlock(`import exopy as exo

exo.decompile("my_level.exolvl", out_py="my_level.py")`, 'python', 'decompile.py')}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Obfuscating Your Export</h2>
        <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Export with ${ic('obfuscate=True')} to scramble all Exoscript, parameter, and variable names:
        </p>
        ${codeBlock(`lvl.export("protected.exolvl", obfuscate=True)`, 'python', 'protect.py')}
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">How Owner Keys Work (<span class="font-mono text-lg">~/.exopy_keys.txt</span>)</h2>
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#111114] p-5 space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <p>
            When you export with ${ic('obfuscate=True')}, ${ic('exopy')} generates a private key for that level's UUID, saves it locally in ${ic('~/.exopy_keys.txt')}, and embeds an <strong>8-byte SHA-256 hash</strong> of that key inside the level file.
          </p>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><strong>If you decompile your own level</strong> on a machine with the matching key in ${ic('~/.exopy_keys.txt')}, ${ic('exo.decompile()')} verifies the hash and unlocks readable Python source.</li>
            <li><strong>If someone else tries to decompile it</strong> without your private key, they only receive an obfuscated payload.</li>
          </ul>
        </div>
        ${callout(
          'Back up your keys file',
          `Save a backup of ${ic('~/.exopy_keys.txt')} if you switch devices or reinstall your OS—without it, even you won't be able to unlock readable source from your obfuscated exports.`,
          'info'
        )}
      </section>
    `,
  },

  {
    id: 'playground',
    group: 'Interactive',
    title: 'Playground & Preview',
    description: 'Write Exoscript code in Python, watch a live 2D level preview, and export .py or .exolvl files.',
    keywords: ['playground', 'preview', 'editor', 'run', 'canvas', 'export', 'exolvl', 'test', 'sandbox', 'exoscript'],
    render: () => `
      <header class="space-y-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Interactive Sandbox</span>
          <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Live Preview</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Playground & Preview</h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Write actual ${ic('exopy')} code below, watch your level and Exoscript animations live, and export a real ${ic('.exolvl')} file ready to import into Exoracer.
        </p>
      </header>

      <section class="space-y-4">
        <!-- Preset Buttons + Run Button -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Presets:</span>
            <button type="button" data-preset="basic" class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-500/50 transition-colors">
              Basic Level
            </button>
            <button type="button" data-preset="moving" class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-500/50 transition-colors">
              Moving Platform Exoscript
            </button>
            <button type="button" data-preset="stored" class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-500/50 transition-colors">
              Stored Blocks &amp; Spinners
            </button>
          </div>

          <button
            id="pg-run-btn"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 transition-all"
          >
            <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Run &amp; Preview</span>
          </button>
        </div>

        <!-- Python Editor -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111114] overflow-hidden shadow-xs">
          <div class="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/60 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-500/80"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-500/80"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-500/80"></span>
              <span class="ml-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">my_exoscript_level.py</span>
            </div>
            <button
              id="pg-copy-btn"
              type="button"
              class="rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-sky-500/50 transition-colors"
            >
              <span class="copy-label">Copy Code</span>
            </button>
          </div>
          <textarea
            id="playground-editor"
            rows="16"
            spellcheck="false"
            class="code-editor w-full resize-y bg-transparent p-4 text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200 focus:outline-none"
          ></textarea>
        </div>

        <!-- Status & Counts Bar -->
        <div id="playground-status" class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 px-4 py-2.5 text-xs font-mono text-zinc-600 dark:text-zinc-300 flex flex-wrap items-center justify-between gap-2">
          <span id="pg-status-text">Ready. Edit the Python code above and click Run &amp; Preview.</span>
          <span id="pg-anim-badge" class="hidden rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">Exoscripts Active</span>
        </div>

        <!-- 2D Preview & Inspector Card -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <button
                id="pg-tab-canvas"
                type="button"
                class="rounded-lg bg-sky-500/15 border border-sky-500/40 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 transition-colors"
              >
                2D Level Preview
              </button>
              <button
                id="pg-tab-inspector"
                type="button"
                class="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
              >
                Inspector &amp; Manifest
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                id="pg-play-toggle"
                type="button"
                class="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-500/50 transition-colors"
              >
                Pause Anim
              </button>
              <button
                id="pg-reset-cam"
                type="button"
                class="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-500/50 transition-colors"
              >
                Reset View
              </button>
            </div>
          </div>

          <!-- Canvas View -->
          <div id="pg-view-canvas" class="relative w-full h-80 sm:h-96 bg-[#0b101b]">
            <canvas id="playground-canvas"></canvas>
            <div class="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 font-mono text-[11px] text-zinc-300">
              Drag to pan &bull; Scroll to zoom
            </div>
          </div>

          <!-- Inspector View -->
          <div id="pg-view-inspector" class="hidden p-4 space-y-4">
            <div id="pg-inspector-summary" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
            <div>
              <div class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Compiled Level Manifest</div>
              <pre id="pg-inspector-json" class="max-h-64 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 font-mono text-xs text-zinc-700 dark:text-zinc-300"></pre>
            </div>
          </div>

          <!-- Export Footer -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3">
            <span class="text-xs text-zinc-500 dark:text-zinc-400">
              Export your code or download a binary <code class="font-mono text-sky-600 dark:text-sky-400">.exolvl</code> to import into Exoracer:
            </span>
            <div class="flex flex-wrap items-center gap-2">
              <button
                id="pg-export-py"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-sky-500/50 transition-colors"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download .py</span>
              </button>
              <button
                id="pg-export-exolvl"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export .exolvl</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `,
  },
];
