/*
File:      github.com/ETmbit/xgo-rider.ts
Copyright: ETmbit, 2026

License:
This file is part of the ETmbit extensions for MakeCode for micro:bit.
It is free software and you may distribute it under the terms of the
GNU General Public License (version 3 or later) as published by the
Free Software Foundation. The full license text you find at
https://www.gnu.org/licenses.

Disclaimer:
ETmbit extensions are distributed without any warranty.

Dependencies:
ETmbit/general
*/

/*
The xgo namespace is a refactoring of the ElecFreaks 'pxt-rider' library:
https://github.com/elecfreaks/pxt-xgo-rider/blob/main/main.ts
(MIT-license)
*/

//##########  BEGIN XGO  ##########//

namespace xgo {
    let headData = 0x5500
    let tailData = 0x00AA
    let headDataH = (headData >> 8) & 0xff;
    let headDataL = (headData >> 0) & 0xff;
    let tailDataH = (tailData >> 8) & 0xff;
    let tailDataL = (tailData >> 0) & 0xff;

    function writeCommand(len: number, addr: number, data: number) {
        let commands_buffer = pins.createBuffer(len)
        commands_buffer[0] = headDataH
        commands_buffer[1] = headDataL
        commands_buffer[2] = len
        commands_buffer[3] = 0x00
        commands_buffer[4] = addr
        commands_buffer[5] = data
        commands_buffer[6] = ~(len + 0x00 + addr + data)
        commands_buffer[7] = tailDataH
        commands_buffer[8] = tailDataL
        serial.writeBuffer(commands_buffer)
        basic.pause(100)
    }

    function writeThreeCommand(len: number, addr: number, data0: number, data1: number, data2: number) {
        let commands_buffer = pins.createBuffer(len)
        commands_buffer[0] = headDataH
        commands_buffer[1] = headDataL
        commands_buffer[2] = len
        commands_buffer[3] = 0x00
        commands_buffer[4] = addr
        commands_buffer[5] = data0
        commands_buffer[6] = data1
        commands_buffer[7] = data2
        commands_buffer[8] = ~(len + 0x00 + addr + data0 + data1 + data2)
        commands_buffer[9] = tailDataH
        commands_buffer[10] = tailDataL
        serial.writeBuffer(commands_buffer)
        basic.pause(100)
    }

    function readCommand(len: number, addr: number, readlen: number) {
        let commands_buffer = pins.createBuffer(len)
        commands_buffer[0] = headDataH
        commands_buffer[1] = headDataL
        commands_buffer[2] = len
        commands_buffer[3] = 0x02
        commands_buffer[4] = addr
        commands_buffer[5] = readlen
        commands_buffer[6] = ~(len + 0x02 + addr + readlen)
        commands_buffer[7] = tailDataH
        commands_buffer[8] = tailDataL
        serial.writeBuffer(commands_buffer)
        let read_data_buffer = pins.createBuffer(9)
        read_data_buffer = serial.readBuffer(9)
        return read_data_buffer[5]
    }

    export function initAction() {
        let status = readCommand(0x09, 0x02, 0x01)
        if (status == 0x00) return;
        writeCommand(0x09, 0x3E, 0xFF)
        basic.pause(1000)
    }

    export function height_xgo(height: number) {
        let data = Math.map(height, -20, 20, 0, 255)
        writeCommand(0x09, 0x35, data)
        basic.pause(100)
    }

    export function angle_xgo(angle: number) {
        let data = Math.map(angle, -100, 100, 0, 255)
        writeCommand(0x09, 0x36, data)
        basic.pause(100)
    }

    export function move_xgo(move: Move, speed: number) {
        if (move == Move.Forward)
            speed = -Math.round( Math.sqrt(speed))
        else {
            speed ^= 2
            if (speed > 100) speed = 100
        }
        let data = Math.map(speed, -100, 100, 0, 255)
        writeCommand(0x09, 0x30, data)
        basic.pause(100)
    }

    export function rotate_xgo(rotation: Rotate, speed: number) {
        if (rotation == Rotate.Clockwise)
            speed = -speed
        let data = Math.map(speed, -100, 100, 0, 255)
        writeCommand(0x09, 0x32, data)
    }

    export function stop_xgo() {
        let data = Math.map(0, -100, 100, 0, 255)
        writeCommand(0x09, 0x30, data)  // move forward/backward
        writeCommand(0x09, 0x32, data)  // turn left/right
    }

    export function ledColor(leds: Led, color: Color) {

        let len, addr, data, wait
        len = 0x0B

        data = fromColor(color)

        if (leds & Led.FrontLeft) {
            addr = 0x69
            writeThreeCommand(len, addr, ((data >> 16) & 0xff), ((data >> 8) & 0xff), ((data >> 0) & 0xff))
        }
        if (leds & Led.RearLeft) {
            addr = 0x6A
            writeThreeCommand(len, addr, ((data >> 16) & 0xff), ((data >> 8) & 0xff), ((data >> 0) & 0xff))
        }
        if (leds & Led.RearRight) {
            addr = 0x6B
            writeThreeCommand(len, addr, ((data >> 16) & 0xff), ((data >> 8) & 0xff), ((data >> 0) & 0xff))
        }
        if (leds & Led.FrontRight) {
            addr = 0x6C
            writeThreeCommand(len, addr, ((data >> 16) & 0xff), ((data >> 8) & 0xff), ((data >> 0) & 0xff))
        }
    }
}

serial.redirect(SerialPin.P14, SerialPin.P13, BaudRate.BaudRate115200)
xgo.initAction()

//##########  END XGO  ##########//



enum Led {
    //% block="the front left led"
    //% block.loc.nl="de led links-voor"
    FrontLeft = 1,
    //% block="the rear left led"
    //% block.loc.nl="de led links-achter"
    RearLeft = 2,
    //% block="the front right led"
    //% block.loc.nl="de led rechts-voor"
    FrontRight = 4,
    //% block="the rear right led"
    //% block.loc.nl="de led rechts-achter"
    RearRight = 8,
    //% block="the left leds"
    //% block.loc.nl="de linker leds"
    Left = 3,
    //% block="the right leds"
    //% block.loc.nl="de rechter leds"
    Right = 12,
    //% block="all leds"
    //% block.loc.nl="alle leds"
    All = 15,
}

//% color="#82200C" icon="\uf1b9"
//% block="XGO Rider"
//% block.loc.nl="XGO Rider"
namespace XGoRider {

    // Speed range:
    // ------------
    // Value: 0 to 100 (in %)
    let SPEED: number = 50

    //% subcategory="Effecten" color="#82705C"
    //% block="turn %led to %color"
    //% block.loc.nl="maak %led %color"
    export function led(led: Led, color: Color) {
        xgo.ledColor(led, color)
    }

    //% subcategory="Effecten" color="#82705C"
    //% block="stretch %height mm"
    //% block.loc.nl="strek %height mm"
    //% height.min=0 height.max=20 height.defl=0
    export function stretch(height: number) {
        if (height < 0) height = 0
        if (height > 20) height = 20
        xgo.height_xgo(height)
    }

    //% subcategory="Effecten" color="#82705C"
    //% block="shrink %height mm"
    //% block.loc.nl="buk %height mm"
    //% height.min=0 height.max=20 height.defl=0
    export function shrink(height: number) {
        if (height < 0) height = 0
        if (height > 20) height = 20
        xgo.height_xgo(-height)
    }

    //% subcategory="Effecten" color="#82705C"
    //% block="lean %angle ° to the left"
    //% block.loc.nl="hel %angle ° over naar links"
    //% angle.min=0 angle.max=45 angle.defl=0
    export function leanLeft(angle: number) {
        if (angle < 0) angle = 0
        if (angle > 45) angle = 45
        xgo.angle_xgo(-2 * angle)
    }

    //% subcategory="Effecten" color="#82705C"
    //% block="lean %angle ° to the right"
    //% block.loc.nl="hel %angle ° over naar rechts"
    //% angle.min=0 angle.max=45 angle.defl=0
    export function leanRight(angle: number) {
        if (angle < 0) angle = 0
        if (angle > 45) angle = 45
        xgo.angle_xgo(2 * angle)
    }

    //% block="stop"
    //% block.loc.nl="stop"
    export function stop() {
        xgo.stop_xgo()
    }

    //% block="stop turning"
    //% block.loc.nl="stop met draaien"
    export function turnStop() {
        xgo.rotate_xgo(Rotate.Clockwise, 0)
    }

    //% block="turn %rotation"
    //% block.loc.nl="draai %rotation"
    export function turn(rotation: Rotate) {
        xgo.move_xgo(Move.Forward, 0)
        if (rotation == Rotate.AntiClockwise)
            xgo.rotate_xgo(Rotate.AntiClockwise, SPEED)
        else
            xgo.rotate_xgo(Rotate.Clockwise, SPEED)
    }

    //% block="ride %movement"
    //% block.loc.nl="rijd %movement"
    export function move(movement: Move) {
        xgo.rotate_xgo(Rotate.Clockwise, 0)
        // speed needs (tested) corrections
        if (movement == Move.Forward)
            xgo.move_xgo(Move.Forward, SPEED)
        else
            xgo.move_xgo(Move.Backward, SPEED)
    }

    //% block="set speed to %speed \\%"
    //% block.loc.nl="stel de snelheid in op %speed \\%"
    //% speed.min=0 speed.max=100 speed.defl=50
    export function setSpeed(speed: number) {
        if (speed < 0) speed = 0
        if (speed > 100) speed = 100
        SPEED = speed
    }
}
