if (!window.ToolBox) {
    class ToolBox {
        constructor(chart) {
            this.onTrendSelect = this.onTrendSelect.bind(this)
            this.onHorzSelect = this.onHorzSelect.bind(this)
            this.onRaySelect = this.onRaySelect.bind(this)
            this.saveDrawings = this.saveDrawings.bind(this)

            this.chart = chart
            this.drawings = []
            this.chart.cursor = 'default'
            this.makingDrawing = false

            this.interval = 24 * 60 * 60 * 1000
            this.activeBackgroundColor = 'rgba(0, 122, 255, 0.7)'
            this.activeIconColor = 'rgb(240, 240, 240)'
            this.iconColor = 'lightgrey'
            this.backgroundColor = 'transparent'
            this.hoverColor = 'rgba(80, 86, 94, 0.7)'
            this.clickBackgroundColor = 'rgba(90, 106, 104, 0.7)'

            this.elem = this.makeToolBox()
            this.subscribeHoverMove()
        }

        toJSON() {
            // Exclude the chart attribute from serialization
            const {chart, ...serialized} = this;
            return serialized;
        }

        makeToolBox() {
            let toolBoxElem = document.createElement('div')
            toolBoxElem.style.position = 'absolute'
            toolBoxElem.style.zIndex = '2000'
            toolBoxElem.style.display = 'flex'
            toolBoxElem.style.alignItems = 'center'
            toolBoxElem.style.top = '25%'
            toolBoxElem.style.borderRight = '2px solid #3C434C'
            toolBoxElem.style.borderTop = '2px solid #3C434C'
            toolBoxElem.style.borderBottom = '2px solid #3C434C'
            toolBoxElem.style.borderTopRightRadius = '4px'
            toolBoxElem.style.borderBottomRightRadius = '4px'
            toolBoxElem.style.backgroundColor = 'rgba(25, 27, 30, 0.5)'
            toolBoxElem.style.flexDirection = 'column'

            this.chart.activeIcon = null

            let trend = this.makeToolBoxElement(this.onTrendSelect, 'KeyT', `<rect x="3.84" y="13.67" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -5.9847 14.4482)" width="21.21" height="1.56"/><path d="M23,3.17L20.17,6L23,8.83L25.83,6L23,3.17z M23,7.41L21.59,6L23,4.59L24.41,6L23,7.41z"/><path d="M6,20.17L3.17,23L6,25.83L8.83,23L6,20.17z M6,24.41L4.59,23L6,21.59L7.41,23L6,24.41z"/>`)
            let horz = this.makeToolBoxElement(this.onHorzSelect, 'KeyH', `<rect x="4" y="14" width="9" height="1"/><rect x="16" y="14" width="9" height="1"/><path d="M11.67,14.5l2.83,2.83l2.83-2.83l-2.83-2.83L11.67,14.5z M15.91,14.5l-1.41,1.41l-1.41-1.41l1.41-1.41L15.91,14.5z"/>`)
            let ray = this.makeToolBoxElement(this.onRaySelect, 'KeyR', `<rect x="8" y="14" width="17" height="1"/><path d="M3.67,14.5l2.83,2.83l2.83-2.83L6.5,11.67L3.67,14.5z M7.91,14.5L6.5,15.91L5.09,14.5l1.41-1.41L7.91,14.5z"/>`)
            //let testB = this.makeToolBoxElement(this.onTrendSelect, `<rect x="8" y="6" width="12" height="1"/><rect x="9" y="22" width="11" height="1"/><path d="M3.67,6.5L6.5,9.33L9.33,6.5L6.5,3.67L3.67,6.5z M7.91,6.5L6.5,7.91L5.09,6.5L6.5,5.09L7.91,6.5z"/><path d="M19.67,6.5l2.83,2.83l2.83-2.83L22.5,3.67L19.67,6.5z M23.91,6.5L22.5,7.91L21.09,6.5l1.41-1.41L23.91,6.5z"/><path d="M19.67,22.5l2.83,2.83l2.83-2.83l-2.83-2.83L19.67,22.5z M23.91,22.5l-1.41,1.41l-1.41-1.41l1.41-1.41L23.91,22.5z"/><path d="M3.67,22.5l2.83,2.83l2.83-2.83L6.5,19.67L3.67,22.5z M7.91,22.5L6.5,23.91L5.09,22.5l1.41-1.41L7.91,22.5z"/><rect x="22" y="9" width="1" height="11"/><rect x="6" y="9" width="1" height="11"/>`)
            toolBoxElem.appendChild(trend)
            toolBoxElem.appendChild(horz)
            toolBoxElem.appendChild(ray)
            //toolBoxElem.appendChild(testB)

            this.chart.div.append(toolBoxElem)

            let commandZHandler = (toDelete) => {
                if (!toDelete) return
                if ('price' in toDelete && toDelete.id !== 'toolBox') return commandZHandler(this.drawings[this.drawings.indexOf(toDelete) - 1])
                this.deleteDrawing(toDelete)
            }
            this.chart.commandFunctions.push((event) => {
                if ((event.metaKey || event.ctrlKey) && event.code === 'KeyZ') {
                    commandZHandler(this.drawings[this.drawings.length - 1])
                    return true
                }
            });

            return toolBoxElem
        }

        makeToolBoxElement(action, keyCmd, paths) {
            let icon = {
                elem: document.createElement('div'),
                action: action,
            }
            icon.elem.style.margin = '3px'
            icon.elem.style.borderRadius = '4px'
            icon.elem.style.display = 'flex'

            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "29");
            svg.setAttribute("height", "29");

            let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.innerHTML = paths
            group.setAttribute("fill", this.iconColor)

            svg.appendChild(group)
            icon.elem.appendChild(svg);

            icon.elem.addEventListener('mouseenter', () => {
                icon.elem.style.backgroundColor = icon === this.chart.activeIcon ? this.activeBackgroundColor : this.hoverColor
            })
            icon.elem.addEventListener('mouseleave', () => {
                icon.elem.style.backgroundColor = icon === this.chart.activeIcon ? this.activeBackgroundColor : this.backgroundColor
            })
            icon.elem.addEventListener('mousedown', () => {
                icon.elem.style.backgroundColor = icon === this.chart.activeIcon ? this.activeBackgroundColor : this.clickBackgroundColor
            })
            icon.elem.addEventListener('mouseup', () => {
                icon.elem.style.backgroundColor = icon === this.chart.activeIcon ? this.activeBackgroundColor : 'transparent'
            })
            icon.elem.addEventListener('click', () => {
                if (this.chart.activeIcon) {
                    this.chart.activeIcon.elem.style.backgroundColor = this.backgroundColor
                    group.setAttribute("fill", this.iconColor)
                    document.body.style.cursor = 'crosshair'
                    this.chart.cursor = 'crosshair'
                    this.chart.activeIcon.action(false)
                    if (this.chart.activeIcon === icon) {
                        return this.chart.activeIcon = null
                    }
                }
                this.chart.activeIcon = icon
                group.setAttribute("fill", this.activeIconColor)
                icon.elem.style.backgroundColor = this.activeBackgroundColor
                document.body.style.cursor = 'crosshair'
                this.chart.cursor = 'crosshair'
                this.chart.activeIcon.action(true)
            })
            this.chart.commandFunctions.push((event) => {
                if (event.altKey && event.code === keyCmd) {
                    event.preventDefault()
                    if (this.chart.activeIcon) {
                        this.chart.activeIcon.elem.style.backgroundColor = this.backgroundColor
                        group.setAttribute("fill", this.iconColor)
                        document.body.style.cursor = 'crosshair'
                        this.chart.cursor = 'crosshair'
                        this.chart.activeIcon.action(false)
                    }
                    this.chart.activeIcon = icon
                    group.setAttribute("fill", this.activeIconColor)
                    icon.elem.style.backgroundColor = this.activeBackgroundColor
                    document.body.style.cursor = 'crosshair'
                    this.chart.cursor = 'crosshair'
                    this.chart.activeIcon.action(true)
                    return true
                }
            })
            return icon.elem
        }

        onTrendSelect(toggle, ray = false) {
            let trendLine = {
                line: null,
                color: 'rgb(15, 139, 237)',
                markers: null,
                data: null,
                from: null,
                to: null,
                ray: ray,
            }
            let firstTime = null
            let firstPrice = null
            let currentTime = null


            if (!toggle) {
                this.chart.chart.unsubscribeClick(this.clickHandler)
                return
            }
            let crosshairHandlerTrend = (param) => {
                this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerTrend)

                if (!this.makingDrawing) return

                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: false})
                let logical = this.chart.chart.timeScale().getVisibleLogicalRange()
                let lastCandleTime = this.chart.candleData[this.chart.candleData.length - 1].time
                currentTime = this.chart.chart.timeScale().coordinateToTime(param.point.x)
                if (!currentTime) {
                    let barsToMove = param.logical - this.chart.chart.timeScale().coordinateToLogical(this.chart.chart.timeScale().timeToCoordinate(lastCandleTime))
                    currentTime = dateToStamp(new Date(stampToDate(this.chart.candleData[this.chart.candleData.length - 1].time).getTime() + (barsToMove * this.interval)))
                }
                let currentPrice = this.chart.series.coordinateToPrice(param.point.y)


                if (!currentTime) return this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                let data = calculateTrendLine(firstTime, firstPrice, currentTime, currentPrice, this.interval, this.chart, ray)
                trendLine.from = [data[0].time, data[0].value]
                trendLine.to = [data[data.length - 1].time, data[data.length-1].value]

                trendLine.line.setData(data)

                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: true})
                this.chart.chart.timeScale().setVisibleLogicalRange(logical)

                if (!ray) {
                    trendLine.markers = [
                        {time: firstTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1},
                        {time: currentTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1}
                    ]
                    trendLine.line.setMarkers(trendLine.markers)
                }
                setTimeout(() => {
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                }, 10);
            }

            this.clickHandler = (param) => {
                if (!this.makingDrawing) {
                    this.makingDrawing = true
                    trendLine.line = this.chart.chart.addLineSeries({
                        color: 'rgb(15, 139, 237)',
                        lineWidth: 2,
                        lastValueVisible: false,
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                        autoscaleInfoProvider: () => ({
                            priceRange: {
                                minValue: 1_000_000_000,
                                maxValue: 0,
                            },
                        }),
                    })
                    firstPrice = this.chart.series.coordinateToPrice(param.point.y)
                    firstTime = !ray ? this.chart.chart.timeScale().coordinateToTime(param.point.x) : this.chart.candleData[this.chart.candleData.length - 1].time
                    this.chart.chart.applyOptions({handleScroll: false})
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                }
                else {
                    this.chart.chart.applyOptions({handleScroll: true})
                    this.makingDrawing = false
                    trendLine.line.setMarkers([])
                    this.drawings.push(trendLine)
                    this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerTrend)
                    this.chart.chart.unsubscribeClick(this.clickHandler)
                    document.body.style.cursor = 'default'
                    this.chart.cursor = 'default'
                    this.chart.activeIcon.elem.style.backgroundColor = this.backgroundColor
                    this.chart.activeIcon = null
                    this.saveDrawings()
                }
            }
            this.chart.chart.subscribeClick(this.clickHandler)
        }

        clickHandlerHorz = (param) => {
                let price = this.chart.series.coordinateToPrice(param.point.y)
                let lineStyle = LightweightCharts.LineStyle.Solid
                let line = new HorizontalLine(this.chart, 'toolBox', price,'red', 2, lineStyle, true)
                this.drawings.push(line)
                this.chart.chart.unsubscribeClick(this.clickHandlerHorz)
                document.body.style.cursor = 'default'
                this.chart.cursor = 'default'
                this.chart.activeIcon.elem.style.backgroundColor = this.backgroundColor
                this.chart.activeIcon = null
                this.saveDrawings()
            }
        onHorzSelect(toggle) {
            !toggle ? this.chart.chart.unsubscribeClick(this.clickHandlerHorz) : this.chart.chart.subscribeClick(this.clickHandlerHorz)
        }

        onRaySelect(toggle) {
            this.onTrendSelect(toggle, true)
        }

        subscribeHoverMove() {
            let hoveringOver = null
            let x, y
            let colorPicker = new ColorPicker(this.saveDrawings)

            let onClickDelete = () => this.deleteDrawing(contextMenu.drawing)
            let onClickColor = (rect) => colorPicker.openMenu(rect, contextMenu.drawing)
            let contextMenu = new ContextMenu()
            contextMenu.menuItem('Color Picker', onClickColor, () =>{
                document.removeEventListener('click', colorPicker.closeMenu)
                colorPicker.container.style.display = 'none'
            })
            contextMenu.separator()
            contextMenu.menuItem('Delete Drawing', onClickDelete)

            let hoverOver = (param) => {
                if (!param.point || this.makingDrawing) return
                this.chart.chart.unsubscribeCrosshairMove(hoverOver)
                x = param.point.x
                y = param.point.y

                this.drawings.forEach((drawing) => {
                    let boundaryConditional
                    let horizontal = false

                    if ('price' in drawing) {
                        horizontal = true
                        let priceCoordinate = this.chart.series.priceToCoordinate(drawing.price)
                        boundaryConditional = Math.abs(priceCoordinate - param.point.y) < 6
                    } else {
                        let trendData = param.seriesData.get(drawing.line);
                        if (!trendData) return
                        let priceCoordinate = this.chart.series.priceToCoordinate(trendData.value)
                        let timeCoordinate = this.chart.chart.timeScale().timeToCoordinate(trendData.time)
                        boundaryConditional = Math.abs(priceCoordinate - param.point.y) < 6 && Math.abs(timeCoordinate - param.point.x) < 6
                    }

                    if (boundaryConditional) {
                        if (hoveringOver === drawing) return
                        if (!horizontal && !drawing.ray) drawing.line.setMarkers(drawing.markers)
                        document.body.style.cursor = 'pointer'
                        document.addEventListener('mousedown', checkForClick)
                        document.addEventListener('mouseup', checkForRelease)
                        hoveringOver = drawing
                        contextMenu.listen(true)
                        contextMenu.drawing = drawing
                    } else if (hoveringOver === drawing) {
                        if (!horizontal && !drawing.ray) drawing.line.setMarkers([])
                        document.body.style.cursor = this.chart.cursor
                        hoveringOver = null
                        contextMenu.listen(false)
                        if (!mouseDown) {
                            document.removeEventListener('mousedown', checkForClick)
                            document.removeEventListener('mouseup', checkForRelease)
                        }
                    }
                })
                this.chart.chart.subscribeCrosshairMove(hoverOver)
            }
            let originalIndex
            let originalTime
            let originalPrice
            let mouseDown = false
            let clickedEnd = false
            let labelColor
            let checkForClick = (event) => {
                mouseDown = true
                document.body.style.cursor = 'grabbing'
                this.chart.chart.applyOptions({handleScroll: false})
                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: false})

                this.chart.chart.unsubscribeCrosshairMove(hoverOver)

                labelColor = this.chart.chart.options().crosshair.horzLine.labelBackgroundColor
                this.chart.chart.applyOptions({crosshair: {horzLine: {labelBackgroundColor: hoveringOver.color}}})
                if ('price' in hoveringOver) {
                    originalPrice = hoveringOver.price
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerHorz)
                } else if (Math.abs(this.chart.chart.timeScale().timeToCoordinate(hoveringOver.from[0]) - x) < 4 && !hoveringOver.ray) {
                    clickedEnd = 'first'
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                } else if (Math.abs(this.chart.chart.timeScale().timeToCoordinate(hoveringOver.to[0]) - x) < 4 && !hoveringOver.ray) {
                    clickedEnd = 'last'
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                } else {
                    originalPrice = this.chart.series.coordinateToPrice(y)
                    originalTime = this.chart.chart.timeScale().coordinateToTime(x * this.chart.scale.width)
                    this.chart.chart.subscribeCrosshairMove(checkForDrag)
                }
                originalIndex = this.chart.chart.timeScale().coordinateToLogical(x)
                document.removeEventListener('mousedown', checkForClick)
            }
            let checkForRelease = (event) => {
                mouseDown = false
                document.body.style.cursor = this.chart.cursor

                this.chart.chart.applyOptions({handleScroll: true})
                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: true})
                this.chart.chart.applyOptions({crosshair: {horzLine: {labelBackgroundColor: labelColor}}})
                if (hoveringOver && 'price' in hoveringOver && hoveringOver.id !== 'toolBox') {
                    window.callbackFunction(`${hoveringOver.id}_~_${hoveringOver.price.toFixed(8)}`);
                }
                hoveringOver = null
                document.removeEventListener('mousedown', checkForClick)
                document.removeEventListener('mouseup', checkForRelease)
                this.chart.chart.subscribeCrosshairMove(hoverOver)
                this.saveDrawings()
            }
            let checkForDrag = (param) => {
                if (!param.point) return
                this.chart.chart.unsubscribeCrosshairMove(checkForDrag)
                if (!mouseDown) return

                let priceAtCursor = this.chart.series.coordinateToPrice(param.point.y)

                let priceDiff = priceAtCursor - originalPrice
                let barsToMove = param.logical - originalIndex

                let startBarIndex = this.chart.candleData.findIndex(item => stampToDate(item.time).getTime() === stampToDate(hoveringOver.from[0]).getTime())
                let endBarIndex = this.chart.candleData.findIndex(item => stampToDate(item.time).getTime() === stampToDate(hoveringOver.to[0]).getTime())

                let startDate
                let endBar
                if (hoveringOver.ray) {
                    endBar = this.chart.candleData[startBarIndex + barsToMove]
                    startDate = hoveringOver.to[0]
                } else {
                    startDate = this.chart.candleData[startBarIndex + barsToMove].time
                    endBar = endBarIndex === -1 ? null : this.chart.candleData[endBarIndex + barsToMove]
                }

                let endDate = endBar ? endBar.time : dateToStamp(new Date(stampToDate(hoveringOver.to[0]).getTime() + (barsToMove * this.interval)))
                let startValue = hoveringOver.from[1] + priceDiff
                let endValue = hoveringOver.to[1] + priceDiff
                let data = calculateTrendLine(startDate, startValue, endDate, endValue, this.interval, this.chart, hoveringOver.ray)


                let logical = this.chart.chart.timeScale().getVisibleLogicalRange()

                hoveringOver.from = [data[0].time, data[0].value]
                hoveringOver.to = [data[data.length - 1].time, data[data.length - 1].value]
                hoveringOver.line.setData(data)

                this.chart.chart.timeScale().setVisibleLogicalRange(logical)

                if (!hoveringOver.ray) {
                    hoveringOver.markers = [
                        {time: startDate, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1},
                        {time: endDate, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1}
                    ]
                    hoveringOver.line.setMarkers(hoveringOver.markers)
                }

                originalIndex = param.logical
                originalPrice = priceAtCursor
                this.chart.chart.subscribeCrosshairMove(checkForDrag)
            }
            let crosshairHandlerTrend = (param) => {
                if (!param.point) return
                this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerTrend)
                if (!mouseDown) return

                let currentPrice = this.chart.series.coordinateToPrice(param.point.y)
                let currentTime = this.chart.chart.timeScale().coordinateToTime(param.point.x)

                let [firstTime, firstPrice] = [null, null]
                if (clickedEnd === 'last') {
                    firstTime = hoveringOver.from[0]
                    firstPrice = hoveringOver.from[1]
                } else if (clickedEnd === 'first') {
                    firstTime = hoveringOver.to[0]
                    firstPrice = hoveringOver.to[1]
                }

                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: false})
                let logical = this.chart.chart.timeScale().getVisibleLogicalRange()

                let lastCandleTime = this.chart.candleData[this.chart.candleData.length - 1].time
                if (!currentTime) {
                    let barsToMove = param.logical - this.chart.chart.timeScale().coordinateToLogical(this.chart.chart.timeScale().timeToCoordinate(lastCandleTime))
                    currentTime = dateToStamp(new Date(stampToDate(this.chart.candleData[this.chart.candleData.length - 1].time).getTime() + (barsToMove * this.interval)))
                }
                let data = calculateTrendLine(firstTime, firstPrice, currentTime, currentPrice, this.interval, this.chart)
                hoveringOver.line.setData(data)

                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: true})
                this.chart.chart.timeScale().setVisibleLogicalRange(logical)

                hoveringOver.from = [data[0].time, data[0].value]
                hoveringOver.to = [data[data.length - 1].time, data[data.length - 1].value]


                hoveringOver.markers = [
                    {time: firstTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1},
                    {time: currentTime, position: 'inBar', color: '#1E80F0', shape: 'circle', size: 0.1}
                ]
                hoveringOver.line.setMarkers(hoveringOver.markers)

                setTimeout(() => {
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerTrend)
                }, 10);
            }
            let crosshairHandlerHorz = (param) => {
                if (!param.point) return
                this.chart.chart.unsubscribeCrosshairMove(crosshairHandlerHorz)
                if (!mouseDown) return
                hoveringOver.updatePrice(this.chart.series.coordinateToPrice(param.point.y))
                setTimeout(() => {
                    this.chart.chart.subscribeCrosshairMove(crosshairHandlerHorz)
                }, 10)
            }
            this.chart.chart.subscribeCrosshairMove(hoverOver)
        }

        renderDrawings() {
            this.drawings.forEach((item) => {
                if ('price' in item) return
                let startDate = dateToStamp(new Date(Math.round(stampToDate(item.from[0]).getTime() / this.interval) * this.interval))
                let endDate = dateToStamp(new Date(Math.round(stampToDate(item.to[0]).getTime() / this.interval) * this.interval))
                let data = calculateTrendLine(startDate, item.from[1], endDate, item.to[1], this.interval, this.chart, item.ray)
                item.from = [data[0].time, data[0].value]
                item.to = [data[data.length - 1].time, data[data.length-1].value]
                item.line.setData(data)
            })
        }

        deleteDrawing(drawing) {
            if ('price' in drawing) {
                this.chart.series.removePriceLine(drawing.line)
            }
            else {
                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: false})
                this.chart.chart.removeSeries(drawing.line);
                this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: true})
            }
            this.drawings.splice(this.drawings.indexOf(drawing), 1)
            this.saveDrawings()
        }

        clearDrawings() {
            this.drawings.forEach((item) => {
                if ('price' in item) this.chart.series.removePriceLine(item.line)
                else this.chart.chart.removeSeries(item.line)
            })
            this.drawings = []
        }

        saveDrawings() {
            let drawingsString = JSON.stringify(this.drawings, (key, value) => {
                if (key === '' && Array.isArray(value)) {
                    return value.filter(item => !(item && typeof item === 'object' && 'priceLine' in item && item.id !== 'toolBox'));
                } else if (key === 'line' || (value && typeof value === 'object' && 'priceLine' in value && value.id !== 'toolBox')) {
                    return undefined;
                }
                return value;
            });
            window.callbackFunction(`save_drawings${this.chart.id}_~_${drawingsString}`)
        }

        loadDrawings(drawings) {
            this.drawings = drawings
            this.chart.chart.applyOptions({handleScroll: false})
            this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: false})
            this.drawings.forEach((item) => {
                let idx = this.drawings.indexOf(item)
                if ('price' in item) {
                    this.drawings[idx] = new HorizontalLine(this.chart, 'toolBox', item.priceLine.price, item.priceLine.color, 2, item.priceLine.lineStyle, item.priceLine.axisLabelVisible)
                }
                else {
                    this.drawings[idx].line = this.chart.chart.addLineSeries({
                        lineWidth: 2,
                        color: this.drawings[idx].color,
                        lastValueVisible: false,
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                        autoscaleInfoProvider: () => ({
                            priceRange: {
                                minValue: 1_000_000_000,
                                maxValue: 0,
                            },
                        }),
                    })
                    let startDate = dateToStamp(new Date(Math.round(stampToDate(item.from[0]).getTime() / this.interval) * this.interval))
                    let endDate = dateToStamp(new Date(Math.round(stampToDate(item.to[0]).getTime() / this.interval) * this.interval))
                    let data = calculateTrendLine(startDate, item.from[1], endDate, item.to[1], this.interval, this.chart, item.ray)
                    item.from = [data[0].time, data[0].value]
                    item.to = [data[data.length - 1].time, data[data.length-1].value]
                    item.line.setData(data)
                }
            })
            this.chart.chart.applyOptions({handleScroll: true})
            this.chart.chart.timeScale().applyOptions({shiftVisibleRangeOnNewBar: true})
        }
    }
    window.ToolBox = ToolBox
}

if (!window.ColorPicker) {
    class ColorPicker {
        constructor(saveDrawings) {
            this.saveDrawings = saveDrawings

            this.container = document.createElement('div')
            this.container.style.maxWidth = '170px'
            this.container.style.backgroundColor = '#191B1E'
            this.container.style.position = 'absolute'
            this.container.style.zIndex = '10000'
            this.container.style.display = 'none'
            this.container.style.flexDirection = 'column'
            this.container.style.alignItems = 'center'
            this.container.style.border = '2px solid #3C434C'
            this.container.style.borderRadius = '8px'
            this.container.style.cursor = 'default'

            let colorPicker = document.createElement('div')
            colorPicker.style.margin = '10px'
            colorPicker.style.display = 'flex'
            colorPicker.style.flexWrap = 'wrap'

            let colors = [
                '#EBB0B0','#E9CEA1','#E5DF80','#ADEB97','#A3C3EA','#D8BDED',
                '#E15F5D','#E1B45F','#E2D947','#4BE940','#639AE1','#D7A0E8',
                '#E42C2A','#E49D30','#E7D827','#3CFF0A','#3275E4','#B06CE3',
                '#F3000D','#EE9A14','#F1DA13','#2DFC0F','#1562EE','#BB00EF',
                '#B50911','#E3860E','#D2BD11','#48DE0E','#1455B4','#6E009F',
                '#7C1713','#B76B12','#8D7A13','#479C12','#165579','#51007E',
            ]

            colors.forEach((color) => colorPicker.appendChild(this.makeColorBox(color)))

            let separator = document.createElement('div')
            separator.style.backgroundColor = '#3C434C'
            separator.style.height = '1px'
            separator.style.width = '130px'

            let opacity = document.createElement('div')
            opacity.style.margin = '10px'

            let opacityText = document.createElement('div')
            opacityText.style.color = 'lightgray'
            opacityText.style.fontSize = '12px'
            opacityText.innerText = 'Opacity'

            let opacityValue = document.createElement('div')
            opacityValue.style.color = 'lightgray'
            opacityValue.style.fontSize = '12px'

            let opacitySlider = document.createElement('input')
            opacitySlider.type = 'range'
            opacitySlider.value = this.opacity*100
            opacityValue.innerText = opacitySlider.value+'%'
            opacitySlider.oninput = () => {
                opacityValue.innerText = opacitySlider.value+'%'
                this.opacity = opacitySlider.value/100
                this.updateColor()
            }

            opacity.appendChild(opacityText)
            opacity.appendChild(opacitySlider)
            opacity.appendChild(opacityValue)

            this.container.appendChild(colorPicker)
            this.container.appendChild(separator)
            this.container.appendChild(opacity)
            document.getElementById('wrapper').appendChild(this.container)

        }
        makeColorBox(color) {
            let box = document.createElement('div')
            box.style.width = '18px'
            box.style.height = '18px'
            box.style.borderRadius = '3px'
            box.style.margin = '3px'
            box.style.boxSizing = 'border-box'
            box.style.backgroundColor = color

            box.addEventListener('mouseover', (event) => box.style.border = '2px solid lightgray')
            box.addEventListener('mouseout', (event) => box.style.border = 'none')

            let rgbValues = this.extractRGB(color)

            box.addEventListener('click', (event) => {
                this.rgbValues = rgbValues
                this.updateColor()
            })
            return box
        }
        extractRGB = (anyColor) => {
            let dummyElem = document.createElement('div');
            dummyElem.style.color = anyColor;
            document.body.appendChild(dummyElem);
            let computedColor = getComputedStyle(dummyElem).color;
            document.body.removeChild(dummyElem);
            let colorValues = computedColor.match(/\d+/g).map(Number);
            let isRgba = computedColor.includes('rgba');
            let opacity = isRgba ? parseFloat(computedColor.split(',')[3]) : 1
            return [colorValues[0], colorValues[1], colorValues[2], opacity]
        }
        updateColor() {
            let oColor = `rgba(${this.rgbValues[0]}, ${this.rgbValues[1]}, ${this.rgbValues[2]}, ${this.opacity})`
            if ('price' in this.drawing) this.drawing.updateColor(oColor)
            else {
                this.drawing.color = oColor
                this.drawing.line.applyOptions({color: oColor})
            }
            this.saveDrawings()
        }
        openMenu(rect, drawing) {
            this.drawing = drawing
            this.rgbValues = this.extractRGB(drawing.color)
            this.opacity = parseFloat(this.rgbValues[3])
            this.container.style.top = (rect.top-30)+'px'
            this.container.style.left = rect.right+'px'
            this.container.style.display = 'flex'
            setTimeout(() => document.addEventListener('mousedown', (event) => {
                if (!this.container.contains(event.target)) {
                    this.closeMenu()
                }
            }), 10)
        }
        closeMenu(event) {
            document.removeEventListener('click', this.closeMenu)
            this.container.style.display = 'none'
        }
    }
    window.ColorPicker = ColorPicker
}
