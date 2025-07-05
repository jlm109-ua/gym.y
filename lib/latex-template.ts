// Plantilla LaTeX base para todos los PDFs
export function generateLatexTemplate(config: {
    title: string
    subtitle: string
    content: string
    date?: string
}) {
    const currentDate =
        config.date ||
        new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })

    return `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\usepackage{pgfplots}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{fancyhdr}
\\usepackage{graphicx}
\\usepackage{longtable}

\\geometry{margin=2cm}
\\pgfplotsset{compat=1.18}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\textbf{${config.title}}}
\\fancyhead[R]{${currentDate}}
\\fancyfoot[C]{\\thepage}

\\definecolor{primarycolor}{RGB}{59, 130, 246}
\\definecolor{secondarycolor}{RGB}{16, 185, 129}
\\definecolor{accentcolor}{RGB}{239, 68, 68}

\\begin{document}

\\begin{center}
\\huge\\textbf{${config.title}}\\\\
\\large\\textcolor{gray}{${config.subtitle}}
\\end{center}

\\vspace{1cm}

${config.content}

\\vspace{1cm}

\\begin{center}
\\textit{Reporte generado automáticamente por Gym.y el ${currentDate}}
\\end{center}

\\end{document}`
}
