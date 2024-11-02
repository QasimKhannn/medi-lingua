import { mirage } from 'ldrs'
import React from 'react'

mirage.register()

interface props {
    color: string
}

const SpeakingLoader: React.FC<props> = ({ color }) => {
    return (
        <l-mirage
            size="45"
            speed="2.5"
            color={color}
        ></l-mirage>
    )
}
export default SpeakingLoader