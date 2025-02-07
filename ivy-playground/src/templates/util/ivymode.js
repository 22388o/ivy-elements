/* Adapted from https://github.com/thlorenz/brace/blob/master/mode/javascript.js,
which is licensed under the following license:

Copyright 2013 Thorsten Lorenz. 
All rights reserved.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

ace.define(
  "ace/mode/doc_comment_highlight_rules",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text_highlight_rules"
  ],
  function(acequire, exports, module) {
    "use strict"

    var oop = acequire("../lib/oop")
    var TextHighlightRules = acequire("./text_highlight_rules")
      .TextHighlightRules

    var DocCommentHighlightRules = function() {
      this.$rules = {
        start: [
          {
            token: "comment.doc.tag",
            regex: "@[\\w\\d_]+"
          },
          DocCommentHighlightRules.getTagRule(),
          {
            defaultToken: "comment.doc",
            caseInsensitive: true
          }
        ]
      }
    }

    oop.inherits(DocCommentHighlightRules, TextHighlightRules)

    DocCommentHighlightRules.getTagRule = function(start) {
      return {
        token: "comment.doc.tag.storage.type",
        regex: "\\b(?:TODO|FIXME|XXX|HACK)\\b"
      }
    }

    DocCommentHighlightRules.getStartRule = function(start) {
      return {
        token: "comment.doc", // doc comment
        regex: "\\/\\*(?=\\*)",
        next: start
      }
    }

    DocCommentHighlightRules.getEndRule = function(start) {
      return {
        token: "comment.doc", // closing comment
        regex: "\\*\\/",
        next: start
      }
    }

    exports.DocCommentHighlightRules = DocCommentHighlightRules
  }
)

ace.define(
  "ace/mode/ivy_highlight_rules",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/doc_comment_highlight_rules",
    "ace/mode/text_highlight_rules"
  ],
  function(acequire, exports, module) {
    "use strict"

    var oop = acequire("../lib/oop")
    var DocCommentHighlightRules = acequire("./doc_comment_highlight_rules")
      .DocCommentHighlightRules
    var TextHighlightRules = acequire("./text_highlight_rules")
      .TextHighlightRules
    var identifierRe =
      "[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*\\b"
    var typeRe = "PublicKey|Signature|Bytes|Hash|Time|Duration|Boolean|Integer|Value"

    var IvyHighlightRules = function(options) {
      var keywordMapper = this.createKeywordMapper(
        {
          "variable.language":
            "checkSig|checkMultiSig|sha256|sha1|ripemd160|older|after|bytes",
          keyword: "contract|clause|verify|unlock"
        },
        "identifier"
      )

      this.$rules = {
        no_regex: [
          DocCommentHighlightRules.getStartRule("doc-start"),
          comments("no_regex"),
          {
            token: "constant.numeric", // hex
            regex: /0(?:[x][0-9a-f]+)/
          },
          {
            token: "constant.numeric", // float
            regex: /-?\d[\d_]*/
          },
          {
            token: [
              "keyword",
              "text",
              "entity.name.function",
              "text",
              "paren.lparen"
            ],
            regex: "(contract)(\\s+)(" + identifierRe + ")(\\s*)(\\()",
            next: "function_arguments"
          },
          {
            token: [
              "keyword",
              "text",
              "entity.name.function",
              "text",
              "paren.lparen"
            ],
            regex: "(clause)(\\s+)(" + identifierRe + ")(\\s*)(\\()",
            next: "function_arguments"
          },
          {
            token: keywordMapper,
            regex: identifierRe
          },
          {
            token: "keyword.operator",
            regex: /==|=|!=|<+=?|>+=?|!|&&|\|\||[!+\-]=?/,
            next: "start"
          },
          {
            token: "punctuation.operator",
            regex: /[?:,;.]/,
            next: "start"
          },
          {
            token: "paren.lparen",
            regex: /[\[({]/,
            next: "start"
          },
          {
            token: "paren.rparen",
            regex: /[\])}]/
          }
        ],
        start: [
          DocCommentHighlightRules.getStartRule("doc-start"),
          comments("start"),
          {
            token: "string.regexp",
            regex: "\\/",
            next: "regex"
          },
          {
            token: "text",
            regex: "\\s+|^$",
            next: "start"
          },
          {
            token: "empty",
            regex: "",
            next: "no_regex"
          }
        ],
        function_arguments: [
          {
            token: ["text", "text", "storage.type"],
            regex: "(" + identifierRe + ")(: )(" + typeRe + ")"
          },
          {
            token: "punctuation.operator",
            regex: "[, ]+"
          },
          {
            token: "punctuation.operator",
            regex: "$"
          },
          {
            token: "empty",
            regex: "",
            next: "no_regex"
          }
        ]
      }
      this.normalizeRules()
    }

    oop.inherits(IvyHighlightRules, TextHighlightRules)

    function comments(next) {
      return [
        {
          token: "comment", // multi line comment
          regex: /\/\*/,
          next: [
            DocCommentHighlightRules.getTagRule(),
            { token: "comment", regex: "\\*\\/", next: next || "pop" },
            { defaultToken: "comment", caseInsensitive: true }
          ]
        },
        {
          token: "comment",
          regex: "\\/\\/",
          next: [
            DocCommentHighlightRules.getTagRule(),
            { token: "comment", regex: "$|^", next: next || "pop" },
            { defaultToken: "comment", caseInsensitive: true }
          ]
        }
      ]
    }
    exports.IvyHighlightRules = IvyHighlightRules
  }
)

ace.define(
  "ace/mode/matching_brace_outdent",
  ["require", "exports", "module", "ace/range"],
  function(acequire, exports, module) {
    "use strict"

    var Range = acequire("../range").Range

    var MatchingBraceOutdent = function() {}
    ;(function() {
      this.checkOutdent = function(line, input) {
        if (!/^\s+$/.test(line)) return false

        return /^\s*\}/.test(input)
      }

      this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row)
        var match = line.match(/^(\s*\})/)

        if (!match) return 0

        var column = match[1].length
        var openBracePos = doc.findMatchingBracket({ row: row, column: column })

        if (!openBracePos || openBracePos.row == row) return 0

        var indent = this.$getIndent(doc.getLine(openBracePos.row))
        doc.replace(new Range(row, 0, row, column - 1), indent)
      }

      this.$getIndent = function(line) {
        return line.match(/^\s*/)[0]
      }
    }.call(MatchingBraceOutdent.prototype))

    exports.MatchingBraceOutdent = MatchingBraceOutdent
  }
)

ace.define(
  "ace/mode/behaviour/cstyle",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/behaviour",
    "ace/token_iterator",
    "ace/lib/lang"
  ],
  function(acequire, exports, module) {
    "use strict"

    var oop = acequire("../../lib/oop")
    var Behaviour = acequire("../behaviour").Behaviour
    var TokenIterator = acequire("../../token_iterator").TokenIterator
    var lang = acequire("../../lib/lang")

    var SAFE_INSERT_IN_TOKENS = ["text", "paren.rparen", "punctuation.operator"]
    var SAFE_INSERT_BEFORE_TOKENS = [
      "text",
      "paren.rparen",
      "punctuation.operator",
      "comment"
    ]

    var context
    var contextCache = {}
    var initContext = function(editor) {
      var id = -1
      if (editor.multiSelect) {
        id = editor.selection.index
        if (contextCache.rangeCount != editor.multiSelect.rangeCount)
          contextCache = { rangeCount: editor.multiSelect.rangeCount }
      }
      if (contextCache[id]) return (context = contextCache[id])
      context = contextCache[id] = {
        autoInsertedBrackets: 0,
        autoInsertedRow: -1,
        autoInsertedLineEnd: "",
        maybeInsertedBrackets: 0,
        maybeInsertedRow: -1,
        maybeInsertedLineStart: "",
        maybeInsertedLineEnd: ""
      }
    }

    var getWrapped = function(selection, selected, opening, closing) {
      var rowDiff = selection.end.row - selection.start.row
      return {
        text: opening + selected + closing,
        selection: [
          0,
          selection.start.column + 1,
          rowDiff,
          selection.end.column + (rowDiff ? 0 : 1)
        ]
      }
    }

    var CstyleBehaviour = function() {
      this.add("braces", "insertion", function(
        state,
        action,
        editor,
        session,
        text
      ) {
        var cursor = editor.getCursorPosition()
        var line = session.doc.getLine(cursor.row)
        if (text == "{") {
          initContext(editor)
          var selection = editor.getSelectionRange()
          var selected = session.doc.getTextRange(selection)
          if (
            selected !== "" &&
            selected !== "{" &&
            editor.getWrapBehavioursEnabled()
          ) {
            return getWrapped(selection, selected, "{", "}")
          } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
            if (
              /[\]\}\)]/.test(line[cursor.column]) ||
              editor.inMultiSelectMode
            ) {
              CstyleBehaviour.recordAutoInsert(editor, session, "}")
              return {
                text: "{}",
                selection: [1, 1]
              }
            } else {
              CstyleBehaviour.recordMaybeInsert(editor, session, "{")
              return {
                text: "{",
                selection: [1, 1]
              }
            }
          }
        } else if (text == "}") {
          initContext(editor)
          var rightChar = line.substring(cursor.column, cursor.column + 1)
          if (rightChar == "}") {
            var matching = session.$findOpeningBracket("}", {
              column: cursor.column + 1,
              row: cursor.row
            })
            if (
              matching !== null &&
              CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)
            ) {
              CstyleBehaviour.popAutoInsertedClosing()
              return {
                text: "",
                selection: [1, 1]
              }
            }
          }
        } else if (text == "\n" || text == "\r\n") {
          initContext(editor)
          var closing = ""
          if (CstyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
            closing = lang.stringRepeat("}", context.maybeInsertedBrackets)
            CstyleBehaviour.clearMaybeInsertedClosing()
          }
          var rightChar = line.substring(cursor.column, cursor.column + 1)
          if (rightChar === "}") {
            var openBracePos = session.findMatchingBracket(
              { row: cursor.row, column: cursor.column + 1 },
              "}"
            )
            if (!openBracePos) return null
            var next_indent = this.$getIndent(session.getLine(openBracePos.row))
          } else if (closing) {
            var next_indent = this.$getIndent(line)
          } else {
            CstyleBehaviour.clearMaybeInsertedClosing()
            return
          }
          var indent = next_indent + session.getTabString()

          return {
            text: "\n" + indent + "\n" + next_indent + closing,
            selection: [1, indent.length, 1, indent.length]
          }
        } else {
          CstyleBehaviour.clearMaybeInsertedClosing()
        }
      })

      this.add("braces", "deletion", function(
        state,
        action,
        editor,
        session,
        range
      ) {
        var selected = session.doc.getTextRange(range)
        if (!range.isMultiLine() && selected == "{") {
          initContext(editor)
          var line = session.doc.getLine(range.start.row)
          var rightChar = line.substring(range.end.column, range.end.column + 1)
          if (rightChar == "}") {
            range.end.column++
            return range
          } else {
            context.maybeInsertedBrackets--
          }
        }
      })

      this.add("parens", "insertion", function(
        state,
        action,
        editor,
        session,
        text
      ) {
        if (text == "(") {
          initContext(editor)
          var selection = editor.getSelectionRange()
          var selected = session.doc.getTextRange(selection)
          if (selected !== "" && editor.getWrapBehavioursEnabled()) {
            return getWrapped(selection, selected, "(", ")")
          } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
            CstyleBehaviour.recordAutoInsert(editor, session, ")")
            return {
              text: "()",
              selection: [1, 1]
            }
          }
        } else if (text == ")") {
          initContext(editor)
          var cursor = editor.getCursorPosition()
          var line = session.doc.getLine(cursor.row)
          var rightChar = line.substring(cursor.column, cursor.column + 1)
          if (rightChar == ")") {
            var matching = session.$findOpeningBracket(")", {
              column: cursor.column + 1,
              row: cursor.row
            })
            if (
              matching !== null &&
              CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)
            ) {
              CstyleBehaviour.popAutoInsertedClosing()
              return {
                text: "",
                selection: [1, 1]
              }
            }
          }
        }
      })

      this.add("parens", "deletion", function(
        state,
        action,
        editor,
        session,
        range
      ) {
        var selected = session.doc.getTextRange(range)
        if (!range.isMultiLine() && selected == "(") {
          initContext(editor)
          var line = session.doc.getLine(range.start.row)
          var rightChar = line.substring(
            range.start.column + 1,
            range.start.column + 2
          )
          if (rightChar == ")") {
            range.end.column++
            return range
          }
        }
      })

      this.add("brackets", "insertion", function(
        state,
        action,
        editor,
        session,
        text
      ) {
        if (text == "[") {
          initContext(editor)
          var selection = editor.getSelectionRange()
          var selected = session.doc.getTextRange(selection)
          if (selected !== "" && editor.getWrapBehavioursEnabled()) {
            return getWrapped(selection, selected, "[", "]")
          } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
            CstyleBehaviour.recordAutoInsert(editor, session, "]")
            return {
              text: "[]",
              selection: [1, 1]
            }
          }
        } else if (text == "]") {
          initContext(editor)
          var cursor = editor.getCursorPosition()
          var line = session.doc.getLine(cursor.row)
          var rightChar = line.substring(cursor.column, cursor.column + 1)
          if (rightChar == "]") {
            var matching = session.$findOpeningBracket("]", {
              column: cursor.column + 1,
              row: cursor.row
            })
            if (
              matching !== null &&
              CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)
            ) {
              CstyleBehaviour.popAutoInsertedClosing()
              return {
                text: "",
                selection: [1, 1]
              }
            }
          }
        }
      })

      this.add("brackets", "deletion", function(
        state,
        action,
        editor,
        session,
        range
      ) {
        var selected = session.doc.getTextRange(range)
        if (!range.isMultiLine() && selected == "[") {
          initContext(editor)
          var line = session.doc.getLine(range.start.row)
          var rightChar = line.substring(
            range.start.column + 1,
            range.start.column + 2
          )
          if (rightChar == "]") {
            range.end.column++
            return range
          }
        }
      })

      this.add("string_dquotes", "insertion", function(
        state,
        action,
        editor,
        session,
        text
      ) {
        if (text == '"' || text == "'") {
          initContext(editor)
          var quote = text
          var selection = editor.getSelectionRange()
          var selected = session.doc.getTextRange(selection)
          if (
            selected !== "" &&
            selected !== "'" &&
            selected != '"' &&
            editor.getWrapBehavioursEnabled()
          ) {
            return getWrapped(selection, selected, quote, quote)
          } else if (!selected) {
            var cursor = editor.getCursorPosition()
            var line = session.doc.getLine(cursor.row)
            var leftChar = line.substring(cursor.column - 1, cursor.column)
            var rightChar = line.substring(cursor.column, cursor.column + 1)

            var token = session.getTokenAt(cursor.row, cursor.column)
            var rightToken = session.getTokenAt(cursor.row, cursor.column + 1)
            if (leftChar == "\\" && token && /escape/.test(token.type))
              return null

            var stringBefore = token && /string|escape/.test(token.type)
            var stringAfter =
              !rightToken || /string|escape/.test(rightToken.type)
            var pair
            if (rightChar == quote) {
              pair = stringBefore !== stringAfter
            } else {
              if (stringBefore && !stringAfter) return null // wrap string with different quote
              if (stringBefore && stringAfter) return null // do not pair quotes inside strings
              var wordRe = session.$mode.tokenRe
              wordRe.lastIndex = 0
              var isWordBefore = wordRe.test(leftChar)
              wordRe.lastIndex = 0
              var isWordAfter = wordRe.test(leftChar)
              if (isWordBefore || isWordAfter) return null // before or after alphanumeric
              if (rightChar && !/[\s;,.})\]\\]/.test(rightChar)) return null // there is rightChar and it isn't closing
              pair = true
            }
            return {
              text: pair ? quote + quote : "",
              selection: [1, 1]
            }
          }
        }
      })

      this.add("string_dquotes", "deletion", function(
        state,
        action,
        editor,
        session,
        range
      ) {
        var selected = session.doc.getTextRange(range)
        if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
          initContext(editor)
          var line = session.doc.getLine(range.start.row)
          var rightChar = line.substring(
            range.start.column + 1,
            range.start.column + 2
          )
          if (rightChar == selected) {
            range.end.column++
            return range
          }
        }
      })
    }

    CstyleBehaviour.isSaneInsertion = function(editor, session) {
      var cursor = editor.getCursorPosition()
      var iterator = new TokenIterator(session, cursor.row, cursor.column)
      if (
        !this.$matchTokenType(
          iterator.getCurrentToken() || "text",
          SAFE_INSERT_IN_TOKENS
        )
      ) {
        var iterator2 = new TokenIterator(
          session,
          cursor.row,
          cursor.column + 1
        )
        if (
          !this.$matchTokenType(
            iterator2.getCurrentToken() || "text",
            SAFE_INSERT_IN_TOKENS
          )
        )
          return false
      }
      iterator.stepForward()
      return (
        iterator.getCurrentTokenRow() !== cursor.row ||
        this.$matchTokenType(
          iterator.getCurrentToken() || "text",
          SAFE_INSERT_BEFORE_TOKENS
        )
      )
    }

    CstyleBehaviour.$matchTokenType = function(token, types) {
      return types.indexOf(token.type || token) > -1
    }

    CstyleBehaviour.recordAutoInsert = function(editor, session, bracket) {
      var cursor = editor.getCursorPosition()
      var line = session.doc.getLine(cursor.row)
      if (
        !this.isAutoInsertedClosing(
          cursor,
          line,
          context.autoInsertedLineEnd[0]
        )
      )
        context.autoInsertedBrackets = 0
      context.autoInsertedRow = cursor.row
      context.autoInsertedLineEnd = bracket + line.substr(cursor.column)
      context.autoInsertedBrackets++
    }

    CstyleBehaviour.recordMaybeInsert = function(editor, session, bracket) {
      var cursor = editor.getCursorPosition()
      var line = session.doc.getLine(cursor.row)
      if (!this.isMaybeInsertedClosing(cursor, line))
        context.maybeInsertedBrackets = 0
      context.maybeInsertedRow = cursor.row
      context.maybeInsertedLineStart = line.substr(0, cursor.column) + bracket
      context.maybeInsertedLineEnd = line.substr(cursor.column)
      context.maybeInsertedBrackets++
    }

    CstyleBehaviour.isAutoInsertedClosing = function(cursor, line, bracket) {
      return (
        context.autoInsertedBrackets > 0 &&
        cursor.row === context.autoInsertedRow &&
        bracket === context.autoInsertedLineEnd[0] &&
        line.substr(cursor.column) === context.autoInsertedLineEnd
      )
    }

    CstyleBehaviour.isMaybeInsertedClosing = function(cursor, line) {
      return (
        context.maybeInsertedBrackets > 0 &&
        cursor.row === context.maybeInsertedRow &&
        line.substr(cursor.column) === context.maybeInsertedLineEnd &&
        line.substr(0, cursor.column) == context.maybeInsertedLineStart
      )
    }

    CstyleBehaviour.popAutoInsertedClosing = function() {
      context.autoInsertedLineEnd = context.autoInsertedLineEnd.substr(1)
      context.autoInsertedBrackets--
    }

    CstyleBehaviour.clearMaybeInsertedClosing = function() {
      if (context) {
        context.maybeInsertedBrackets = 0
        context.maybeInsertedRow = -1
      }
    }

    oop.inherits(CstyleBehaviour, Behaviour)

    exports.CstyleBehaviour = CstyleBehaviour
  }
)

ace.define(
  "ace/mode/folding/cstyle",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/range",
    "ace/mode/folding/fold_mode"
  ],
  function(acequire, exports, module) {
    "use strict"

    var oop = acequire("../../lib/oop")
    var Range = acequire("../../range").Range
    var BaseFoldMode = acequire("./fold_mode").FoldMode

    var FoldMode = (exports.FoldMode = function(commentRegex) {
      if (commentRegex) {
        this.foldingStartMarker = new RegExp(
          this.foldingStartMarker.source.replace(
            /\|[^|]*?$/,
            "|" + commentRegex.start
          )
        )
        this.foldingStopMarker = new RegExp(
          this.foldingStopMarker.source.replace(
            /\|[^|]*?$/,
            "|" + commentRegex.end
          )
        )
      }
    })
    oop.inherits(FoldMode, BaseFoldMode)
    ;(function() {
      this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/
      this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/
      this.singleLineBlockCommentRe = /^\s*(\/\*).*\*\/\s*$/
      this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/
      this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/
      this._getFoldWidgetBase = this.getFoldWidget
      this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row)
        if (this.singleLineBlockCommentRe.test(line)) {
          if (
            !this.startRegionRe.test(line) &&
            !this.tripleStarBlockCommentRe.test(line)
          )
            return ""
        }
        var fw = this._getFoldWidgetBase(session, foldStyle, row)
        if (!fw && this.startRegionRe.test(line)) return "start" // lineCommentRegionStart
        return fw
      }

      this.getFoldWidgetRange = function(
        session,
        foldStyle,
        row,
        forceMultiline
      ) {
        var line = session.getLine(row)
        if (this.startRegionRe.test(line))
          return this.getCommentRegionBlock(session, line, row)
        var match = line.match(this.foldingStartMarker)
        if (match) {
          var i = match.index

          if (match[1])
            return this.openingBracketBlock(session, match[1], row, i)
          var range = session.getCommentFoldRange(row, i + match[0].length, 1)
          if (range && !range.isMultiLine()) {
            if (forceMultiline) {
              range = this.getSectionRange(session, row)
            } else if (foldStyle != "all") range = null
          }
          return range
        }

        if (foldStyle === "markbegin") return

        var match = line.match(this.foldingStopMarker)
        if (match) {
          var i = match.index + match[0].length

          if (match[1])
            return this.closingBracketBlock(session, match[1], row, i)

          return session.getCommentFoldRange(row, i, -1)
        }
      }

      this.getSectionRange = function(session, row) {
        var line = session.getLine(row)
        var startIndent = line.search(/\S/)
        var startRow = row
        var startColumn = line.length
        row = row + 1
        var endRow = row
        var maxRow = session.getLength()
        while (++row < maxRow) {
          line = session.getLine(row)
          var indent = line.search(/\S/)
          if (indent === -1) continue
          if (startIndent > indent) break
          var subRange = this.getFoldWidgetRange(session, "all", row)
          if (subRange) {
            if (subRange.start.row <= startRow) {
              break
            } else if (subRange.isMultiLine()) {
              row = subRange.end.row
            } else if (startIndent == indent) {
              break
            }
          }
          endRow = row
        }
        return new Range(
          startRow,
          startColumn,
          endRow,
          session.getLine(endRow).length
        )
      }

      this.getCommentRegionBlock = function(session, line, row) {
        var startColumn = line.search(/\s*$/)
        var maxRow = session.getLength()
        var startRow = row
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/
        var depth = 1
        while (++row < maxRow) {
          line = session.getLine(row)
          var m = re.exec(line)
          if (!m) continue
          if (m[1]) depth--
          else depth++

          if (!depth) break
        }

        var endRow = row
        if (endRow > startRow) {
          return new Range(startRow, startColumn, endRow, line.length)
        }
      }
    }.call(FoldMode.prototype))
  }
)

ace.define(
  "ace/mode/ionio",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text",
    "ace/mode/ivy_highlight_rules",
    "ace/mode/matching_brace_outdent",
    "ace/range",
    "ace/worker/worker_client",
    "ace/mode/behaviour/cstyle",
    "ace/mode/folding/cstyle"
  ],
  function(acequire, exports, module) {
    "use strict"

    var oop = acequire("../lib/oop")
    var TextMode = acequire("./text").Mode
    var IvyHighlightRules = acequire("./ivy_highlight_rules").IvyHighlightRules
    var MatchingBraceOutdent = acequire("./matching_brace_outdent")
      .MatchingBraceOutdent
    var Range = acequire("../range").Range
    var WorkerClient = acequire("../worker/worker_client").WorkerClient
    var CstyleBehaviour = acequire("./behaviour/cstyle").CstyleBehaviour
    var CStyleFoldMode = acequire("./folding/cstyle").FoldMode

    var Mode = function() {
      this.HighlightRules = IvyHighlightRules
      this.$outdent = new MatchingBraceOutdent()
      this.$behaviour = new CstyleBehaviour()
      this.foldingRules = new CStyleFoldMode()
    }
    oop.inherits(Mode, TextMode)

    exports.Mode = Mode
  }
)
