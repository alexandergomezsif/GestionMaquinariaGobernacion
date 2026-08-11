/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Motor Gráfico Nativo en HTML5 Canvas (Bar, Donut, Line Charts)
 */

window.AppCanvasCharts = (function() {
  function getScaledContext(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  return {
    renderDonutChart(canvasId, labels, values, colors) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const { ctx, width, height } = getScaledContext(canvas);

      const total = values.reduce((sum, val) => sum + val, 0);
      ctx.clearRect(0, 0, width, height);

      if (total === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos disponibles', width / 2, height / 2);
        return;
      }

      const centerX = width * 0.35;
      const centerY = height / 2;
      const outerRadius = Math.min(centerX, centerY) - 15;
      const innerRadius = outerRadius * 0.6;

      let startAngle = -Math.PI / 2;

      values.forEach((val, i) => {
        const sliceAngle = (val / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = colors[i] || '#006837';
        ctx.fill();

        startAngle = endAngle;
      });

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toString(), centerX, centerY - 6);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('TOTAL', centerX, centerY + 14);

      const legendX = width * 0.55; // movido más a la izquierda para evitar corte
      let legendY = height / 2 - (labels.length * 20) / 2;

      labels.forEach((label, i) => {
        const pct = ((values[i] / total) * 100).toFixed(1);
        
        ctx.fillStyle = colors[i] || '#006837';
        ctx.fillRect(legendX, legendY, 12, 12);

        ctx.fillStyle = '#1e293b';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Truncar texto si es muy largo
        let text = `${label}: ${values[i]} (${pct}%)`;
        if (text.length > 35) text = text.substring(0, 32) + '...';
        
        ctx.fillText(text, legendX + 18, legendY + 6);

        legendY += 24;
      });
    },

    renderBarChart(canvasId, labels, values, barColors) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const { ctx, width, height } = getScaledContext(canvas);

      ctx.clearRect(0, 0, width, height);
      const maxVal = Math.max(...values, 1);

      const paddingLeft = 40;
      const paddingBottom = 75; // aumentado para el texto rotado
      const paddingTop = 20;
      const paddingRight = 20;

      const graphWidth = width - paddingLeft - paddingRight;
      const graphHeight = height - paddingTop - paddingBottom;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, paddingTop);
      ctx.lineTo(paddingLeft, height - paddingBottom);
      ctx.lineTo(width - paddingRight, height - paddingBottom);
      ctx.stroke();

      const barWidth = (graphWidth / (labels.length || 1)) * 0.6;
      const spacing = (graphWidth / (labels.length || 1)) * 0.4;

      labels.forEach((label, i) => {
        const val = values[i];
        const barHeight = (val / maxVal) * graphHeight;
        const x = paddingLeft + (i * (barWidth + spacing)) + spacing / 2;
        const y = height - paddingBottom - barHeight;

        const color = Array.isArray(barColors) ? barColors[i] : barColors || '#006837';
        ctx.fillStyle = color;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val.toString(), x + barWidth / 2, y - 5);

        // Texto rotado
        ctx.save();
        ctx.translate(x + barWidth / 2, height - paddingBottom + 12);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(label, 0, 0);
        ctx.restore();
      });
    },

    renderLineChart(canvasId, labels, values, strokeColor = '#006837') {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const { ctx, width, height } = getScaledContext(canvas);

      ctx.clearRect(0, 0, width, height);
      const maxVal = Math.max(...values, 100);

      const paddingLeft = 45;
      const paddingBottom = 35;
      const paddingTop = 25;
      const paddingRight = 25;

      const graphWidth = width - paddingLeft - paddingRight;
      const graphHeight = height - paddingTop - paddingBottom;

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (graphHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
      }

      const points = labels.map((label, i) => {
        const x = paddingLeft + (i * (graphWidth / (labels.length - 1 || 1)));
        const y = height - paddingBottom - ((values[i] / maxVal) * graphHeight);
        return { x, y, val: values[i], label };
      });

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - paddingBottom);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 104, 55, 0.08)';
      ctx.fill();

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.val}%`, p.x, p.y - 10);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(p.label, p.x, height - paddingBottom + 18);
      });
    }
  };
})();
