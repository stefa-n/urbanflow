import Image from "next/image"
export default function Rewards() {
    return (
        <div className="mt-16">
            {/* <div className="flex w-[70vw] bg-white p-8 rounded-lg">
                <div className="flex flex-wrap justify-between items-center w-[100%]">
                    <h1 className="text-3xl font-bold text-gray-900">Recompense</h1>
                    <p className="font-bold bg-cyan-600 p-2 rounded-lg text-white">500 🍀</p>
                </div> */}

                {/* aici vin placeholdere pt rewards */}
            {/* </div> */}
            <div className="reward-main" style={{height: '40rem', width:'100%',backgroundColor:'#333',display:'flex',alignItems:'center',justifyContent:'flex-start', flexDirection: 'column'}}>
                <Image src={require("../../public/logo/UrbanFlow2.png")} style={{}}></Image>
                <p style={{fontSize:'1.5rem'}}>Cumpara din ... cu puncte</p>
            </div>
        </div>
    )
}