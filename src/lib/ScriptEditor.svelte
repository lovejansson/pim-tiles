<script lang="ts">
    import type monaco from 'monaco-editor';
    import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
    import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
    import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
    import codeEditorTheme from "./codeEditorTheme.json"

    let editorContainer: HTMLDivElement;
    let editor: monaco.editor.IStandaloneCodeEditor| null = $state(null);
    let Monaco;


    $effect(() => {
        // @ts-ignore
        self.MonacoEnvironment = {
            getWorker: function (_moduleId: any, label: string) {
                if (label === 'json') {
                    return new jsonWorker();
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return new cssWorker();
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return new htmlWorker();
                }
                if (label === 'typescript' || label === 'javascript') {
                    return new tsWorker();
                }
                return new editorWorker();
            }
        };

        import('monaco-editor').then(m => {
            Monaco = m;

            Monaco.editor.defineTheme("gray-matter-light", {
  base: "vs",
  inherit: false,
  rules: [
    // Default text
    { token: "", foreground: "3C3C3C", background: "F5F5F5" },

    // Comments
    { token: "comment", foreground: "b5b7b9" },
    { token: "comment.punctuation", foreground: "b5b7b9" },

    // Markdown structural elements
    { token: "punctuation.definition.constant.markdown", foreground: "b5b7b9" },
    { token: "punctuation.definition.bold.markdown", foreground: "b5b7b9" },
    { token: "punctuation.definition.italic.markdown", foreground: "b5b7b9" },
    { token: "punctuation.definition.heading.markdown", foreground: "b5b7b9" },
    { token: "markup.list.numbered", foreground: "b5b7b9" },

    // Markdown headings
    { token: "markup.heading", foreground: "363636", fontStyle: "bold" },

    // Bold / italic text
    { token: "markup.bold", fontStyle: "bold" },
    { token: "markup.italic", fontStyle: "italic" },

    // Blockquote
    { token: "markup.quote", fontStyle: "italic" },

    // Markdown separators / hr
    { token: "meta.separator.markdown", foreground: "b5b7b9" },

    // Markdown link syntax components
    { token: "punctuation.definition.link", foreground: "b5b7b9" },
    { token: "string.other.link.title", foreground: "363636" },
    { token: "meta.link", foreground: "b5b7b9" },

    // Markdown image syntax
    { token: "meta.image", foreground: "b5b7b9" },

    // Escaped characters
    { token: "constant.character.escape", foreground: "b5b7b9" },

    // Code blocks
    { token: "markup.raw", background: "ececec" },
    { token: "punctuation.definition.raw", foreground: "b5b7b9" },

    // Inline HTML
    { token: "meta.tag.inline", foreground: "b5b7b9" },

    // MultiMarkdown / Pandoc extended scopes
    { token: "meta.header.multimarkdown", foreground: "b5b7b9" },
    { token: "citation.bracket.pandoc", foreground: "b5b7b9" },
    { token: "footnote.delim.pandoc", foreground: "b5b7b9" },
    { token: "quote.pandoc", fontStyle: "italic" },

    // Git gutter markers
    { token: "markup.deleted.git_gutter", foreground: "b5b7b9" },
    { token: "markup.inserted.git_gutter", foreground: "b5b7b9" },
    { token: "markup.changed.git_gutter", foreground: "b5b7b9" },

    // Overrides
    { token: "string.other.link.description.markdown", foreground: "363636" }
  ],

  // === UI COLORS FROM JSON ===
  colors: {
    "editor.background": "#F5F5F5",
    "editor.foreground": "#363636",
    "editorCursor.foreground": "#363636",

    "editor.lineHighlightBackground": "#ececec",
    "editor.rangeHighlightBackground": "#ececec",
    "editor.hoverHighlightBackground": "#ececec",
    "editor.selectionBackground": "#C3E8F3",
    "editor.inactiveSelectionBackground": "#C3E8F3",
    "editor.selectionHighlightBackground": "#C3E8F3",
    "editor.wordHighlightBackground": "#C3E8F3",
    "editor.wordHighlightStrongBackground": "#29BEEA",

    "editor.findMatchBackground": "#C3E8F3",
    "editor.findMatchHighlightBackground": "#C3E8F3",
    "editor.findRangeHighlightBackground": "#29BEEA",

    "editorLineNumber.foreground": "#b5b7b9",
    "editorWhitespace.foreground": "#b5b7b9",
    "editorIndentGuide.background": "#F5F5F5",
    "editorIndentGuide.activeBackground": "#b5b7b9",

    "scrollbar.shadow": "#ececec",
    "widget.shadow": "#ececec"
  }
});


            editor = Monaco.editor.create(editorContainer, {
            value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
            language: 'javascript',
            theme: "gray-matter-light",
            autoDetectHighContrast: false
        });



            const ro = new ResizeObserver(() => {
                editor?.layout();
            });

            ro.observe(editorContainer);
        });
     

        return () => {
            editor?.dispose();
        };
    });



</script>


<div  bind:this={editorContainer}>

</div>

<style lang="postcss">
    div {
        height: 100%;
        width: 100%;
    }

</style>
