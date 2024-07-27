'use client'
import { FormEvent, useState } from "react";
import "./globals.css";
import Swal from "sweetalert2";


export default function Home() {
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const Toast = Swal.mixin({
    toast: true,
    position: 'center',
    iconColor: 'white',
    customClass: {
      popup: 'colored-toast',
    },
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if(emailInput == null || emailInput == ""){
      await Toast.fire({
        icon: 'error',
        title: 'Please enter your email',
      })
      return
    }
    await fetch('/api/receiveEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'email': emailInput}),
    }).then(response => {
      if(response.status == 422){
        Toast.fire({
          icon: 'error',
          title: 'invalid email',
        })
        return
      }
      Toast.fire({
        icon: 'success',
        title: 'Email sent!',
      })
    }).catch(error => {
      Toast.fire({
        icon: 'error',
        title: error,
      })
    })
  }
  return (
    <main className="overflow-x-clip overflow-y-auto">
      {/* Main body  */}
      <div className=" min-h-screen flex flex-col py-7 px-16 bg-gradient-to-br from-slice-white from-55% via-[#FBCFCD] via-85% to-slice-pink gap-12">
        <h1 className="w-full font-inria-serif text-3xl ">Slice</h1>
        
        <div className="flex flex-col lg:flex-row items-center justify-center">
          {/* Texts */}
          <div className="flex gap-9 flex-col items-center lg:items-start justify-center">
            <div className="relative">
              <p className="w-full font-inria-serif font-bold text-4xl xl:text-6xl text-center lg:text-left">Watch only the important parts</p>
              <div className="absolute bg-slice-pink text-white rounded-full p-2 font-inter top rotate-12 -right-10 top-8 lg:top-14">Coming soon!</div>
            </div>
            <p className="lg:text-left xl:text-xl font-inter font-light text-lg text-center">Consume a 2hr lecture in just 10mins by cutting out the boring parts</p>
            {/* Form */}
            <form className="flex justify-center w-full shadow-lg rounded-md" onSubmit={onSubmit}>
                <input onChange={(e) => setEmailInput(e.target.value)} className="w-full rounded-l-md p-2" type="text" placeholder="name@slice.com" name="Email sign up"/>
                <button className="whitespace-nowrap bg-slice-pink text-white p-2 rounded-r-md">Join the waitlist</button>
            </form>
          </div>

          <img src={'/home/cake-slice-desktop.png'} alt="Hero of cake being sliced" className="w-96 md:w-[500px] lg:w-[600px] xl:w-[700px]"/>

        </div>
      </div>
    </main>
  );
}
