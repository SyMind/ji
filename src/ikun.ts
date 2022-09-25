const FRAME = 1000 / 60

const TOUCH_EVENT = 1
const MOUSE_EVENT = 2

const EVENT_TYPE: Record<string, number> = {
    touchstart: TOUCH_EVENT,
    touchmove: TOUCH_EVENT,
    touchend: TOUCH_EVENT,
  
    mousedown: MOUSE_EVENT,
    mousemove: MOUSE_EVENT,
    mouseup: MOUSE_EVENT,
    mouseleave: MOUSE_EVENT
}

// 坐标旋转
const rotatePoint = (cx: number, cy: number, x: number, y: number, angle: number): {x: number, y: number} => {
    const radians = (Math.PI / 180) * angle
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx
    const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy
    return {
        x: nx, 
        y: ny
    }
}

interface IKunOptions {
    container: HTMLElement
    muted?: boolean
} 

class IKun {
    muted: boolean

    count = 0

    v = {
        r: 12, // 角度
        y: 2, // 高度
        t: 0, // 垂直速度
        w: 0, // 横向速度
        d: 0.988 // 衰减
    }
    inertia = 0.08 // 惯性
    sticky = 0.1 // 粘性
    maxR = 60 // 最大角度
    maxY = 110 // 最大高度

    last: number | null = null
    rotate = 0
    initiated: number | false = false
    pageX: number = 0
    pageY: number = 0

    container: HTMLElement
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    image: HTMLImageElement
    outline: HTMLDivElement
    audio: {
        transient: HTMLAudioElement
        dancing: HTMLAudioElement
        crazy: HTMLAudioElement
    }

    height = 800
    width = 500

    imageHeight = 300
    imageWidth = 197

    constructor({container, muted = false}: IKunOptions) {
        this.muted = muted

        this.audio = {
            transient: new Audio(`${process.env.ASSET_PREFIX}/j.mp3`),
            dancing: new Audio(`${process.env.ASSET_PREFIX}/jntm.mp3`),
            crazy: new Audio(`${process.env.ASSET_PREFIX}/ngm.mp3`)
        }
        const {height, width} = this
        this.container = container
        container.style.position = 'relative'
        container.style.height = height + 'px'
        container.style.width = width + 'px'

        const image = this.image = new Image(197, 300)
        image.src = 'kun.png'

        const outline = this.outline = document.createElement('div')
        outline.style.position = 'absolute'
        outline.style.left = '50%'
        outline.style.top = '50%'
        outline.style.transform = 'translate(-50%, -50%)'
        outline.style.display = 'flex'
        outline.appendChild(image)

        const dpr = window.devicePixelRatio || 1
        const canvas = this.canvas = document.createElement('canvas')
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'

        const context = this.context = canvas.getContext('2d')!
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.scale(dpr, dpr)

        this.mount()
    }

    setMuted = (muted: boolean): void => {
        Object.values(this.audio).forEach(item => {
            item.muted = true
            item.play()
            item.pause()
            item.muted = muted
        })
        this.muted = muted
    }

    mount() {
        const {outline, container} = this

        outline.addEventListener('mousedown', this.start)
        outline.addEventListener('touchstart', this.start)
        document.addEventListener('mousemove', this.move)
        document.addEventListener('touchmove', this.move)
        document.addEventListener('mouseup', this.end)
        document.addEventListener('mouseleave', this.end)
        document.addEventListener('touchcancel', this.end)
        document.addEventListener('touchend', this.end)

        container.appendChild(outline)
        container.appendChild(this.canvas)
    }

    dispose = () => {
        const {outline, container} = this

        outline.removeEventListener('mousedown', this.start)
        outline.removeEventListener('touchstart', this.start)
        document.removeEventListener('mousemove', this.move)
        document.removeEventListener('touchmove', this.move)
        document.removeEventListener('mouseup', this.end)
        document.removeEventListener('mouseleave', this.end)
        document.removeEventListener('touchcancel', this.end)
        document.removeEventListener('touchend', this.end)

        container.removeChild(outline)
        container.removeChild(this.canvas)
    }

    start = (event: TouchEvent | MouseEvent) => {
        event.preventDefault()
        const eventType = EVENT_TYPE[event.type]
        if (this.initiated && this.initiated !== eventType) {
            return
        }
        this.initiated = eventType

        const touch = 'targetTouches' in event ? event.touches[0] : event
        this.pageX = touch.pageX
        this.pageY = touch.pageY

        // 确保通过用户触发事件获得音频播放授权
        const {transient, dancing, crazy} = this.audio
        transient.muted = this.muted
        dancing.muted = this.muted
        crazy.muted = this.muted
    }

    move = (event: TouchEvent | MouseEvent) => {
        if (EVENT_TYPE[event.type] !== this.initiated) {
            return
        }

        const touch = 'targetTouches' in event ? event.touches[0] : event
        const rect = this.container.getBoundingClientRect()
        const leftCenter = rect.left + rect.width / 2
        const { pageX, pageY } = touch

        const x = pageX - leftCenter
        let y = pageY - this.pageY

        let r = x * this.sticky

        r = Math.max(-this.maxR, r)
        r = Math.min(this.maxR, r)

        y = y * this.sticky * 3

        y = Math.max(-this.maxY, y)
        y = Math.min(this.maxY, y)

        this.v.r = r
        this.v.y = y
        this.v.w = 0
        this.v.t = 0

        this.draw()
    }

    end = (event: TouchEvent | MouseEvent) => {
        if (EVENT_TYPE[event.type] !== this.initiated) {
            return
        }
        this.initiated = false
        this.run()
        this.play()
    }

    play = () => {
        this.count++

        const {transient, dancing, crazy} = this.audio
        if (this.count > 2) {
            this.count = 0;
            crazy.currentTime = 0
            crazy.play()
            transient.pause()
            dancing.pause()
        } else if (Math.abs(this.v.r) <= 6) {
            transient.currentTime = 0
            transient.play()
            dancing.pause()
            crazy.pause()
        } else if (Math.abs(this.v.r) > 6 && Math.abs(this.v.r) <= 30) {
            dancing.currentTime = 0
            dancing.play()
            transient.pause()
            crazy.pause()
        } else if (Math.abs(this.v.r) > 30) {
            crazy.currentTime = 0
            crazy.play()
            transient.pause()
            dancing.pause()
        }
    }

    draw = () => {
        const { r, y } = this.v
        const x = r * 5
        this.image.style.transform = `rotate(${r}deg) translateX(${x}px) translateY(${y}px)`

        const {context, width, height} = this

        context.clearRect(0, 0, width, height)
        context.save()
    
        context.strokeStyle = '#182562'
        context.lineWidth = 10
    
        context.beginPath()
        context.moveTo(
            this.width / 2,
            this.height
        )

        const angle = Math.PI / 180 * r
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const nx = cos * x - sin * (150 + y) + this.width / 2
        const ny = sin * x + cos * (150 + y) + this.height / 2 + this.imageHeight / 2 - 150
        
        context.quadraticCurveTo(
            this.width / 2,
            this.height - 100,
            nx,
            ny
        )

        context.stroke()
        context.restore()
    }

    run = () => {
        if(this.initiated) {
            return
        }

        const now = Date.now()

        let i = this.inertia
        const delta = this.last ? now - this.last : 16
        if(delta < 16){ // 如果单帧间隔超过 16ms 那就躺平不处理
            i = i / FRAME * delta
        }
        this.last = now
        
        let { r, y, t, w, d } = this.v

        w = w - r * 2 - this.rotate
        r = r + w * i * 1.2
        this.v.w = w * d
        this.v.r = r

        t = t - y * 2
        y = y + t * i * 2
        this.v.t = t * d
        this.v.y = y

        // 小于一定动作时停止重绘
        if(
            Math.max(
                Math.abs(this.v.w),
                Math.abs(this.v.r),
                Math.abs(this.v.t),
                Math.abs(this.v.y)
            ) < 0.1
        ) {
            return
        }

        this.draw()
        requestAnimationFrame(this.run)
    }
}

export default IKun
