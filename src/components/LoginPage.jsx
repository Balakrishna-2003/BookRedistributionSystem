// src/pages/LoginPage.js

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';


const LoginPage = ({setCurrentUser, handleAuthe, setBooks, isaDonor, setIsaDonor, setUserRole }) => {


  const [session, setSession] = useState(null);

  const [isDonor, setIsDonor] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // console.log("initial session");
      
      // console.log(session);

    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  const signInWithOAuth = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: isDonor ? import.meta.env.VITE_APP_URL+'/donorDashboard' : import.meta.env.VITE_APP_URL+'/receiverDashboard',
        queryParams: {
          prompt: 'consent', // Force account selection on each login
        },
      }
    });
    setLoading(false);
    console.log("data");
    // setSession(data);
    console.log(session);

    console.log(data.user, error);

  }


  const navigate = useNavigate();

  

  // const handleAuth = (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setTimeout(() => {
  //     setLoading(false);
  //     const role = isDonor ? 'Donor' : 'Receiver';
  //     const action = isRegistering ? 'registered' : 'logged in';
  //     // alert(`${role} ${action} with email: ${email}`);
  //     setEmail('');
  //     setPassword('');
  //     setIsRegistering(false);
  //   }, 1500);
  // };

  // const handleGoogleLogin = () => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     setLoading(false);
  //     const role = isDonor ? 'Donor' : 'Receiver';
  //     const { data, error } = supabase.auth.signInWithOAuth({
  //       provider: 'google',
  //     });
  //     console.log(data, error);
  //     // alert(`Google ${role} logged in`);
  //     // Simulate successful login after delay
  //     setEmail('');
  //     setPassword('');
  //     setIsRegistering(false);
  //     navigate(isDonor ? '/donorDashboard' : '/receiverDashboard');
  //   }, 1500);
  // };

  const handleDonorRegister = async () => {
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
        },
      },
    }
    );
    console.log(data);

    if (error) {
      console.log(error);
      // Check for the specific "already registered" error
      if (error.message.includes("User already registered")) {
        alert("This email is already registered. Please log in.");
      } else {
        alert("Registration failed: " + error.message);
      }
      return;
    }

    if (data.user) {
      // alert("Registration successful! Please check your email to confirm your account.");
      // setShowPopup(true);
      console.log("id ");
      console.log(data);
      setCurrentUser(data.user);
      
        // navigate('/');
      navigate(isDonor?'/donorDashboard':'/receiverDashboard');
    }
  }

  const handleDonorLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    console.log(email, password);

    console.log(data, error);
    if (data.user) {
      navigate('/donorDashboard');
      console.log(data);
    }
  }

  const handleReceiverRegister = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
        },
      },
    }
    );
    console.log(data);

    if (error) {
      console.log(error);
      // Check for the specific "already registered" error
      if (error.message.includes("User already registered")) {
        alert("This email is already registered. Please log in.");
      } else {
        alert("Registration failed: " + error.message);
      }
      return;
    }

    if (data.user) {
      alert("Registration successful!");
      navigate('/receiverDashboard');
    }

  }

  const handleReceiverLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    console.log(email, password);

    console.log(data, error);
    if (data.user) {
      navigate('/receiverDashboard');
      console.log(data);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-6">

        {/* Role Switcher */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => {
              setIsDonor(true);
              setIsRegistering(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${isDonor ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Book Donor
          </button>
          <button
            onClick={() => {
              setIsDonor(false);
              setIsRegistering(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${!isDonor ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Book Receiver
          </button>

        </div>

        {/* Authentication Form */}
        <div className="space-y-4 text-center">
          <h3 className="text-2xl font-bold text-gray-900">{isDonor ? 'Book Donor' : 'Book Receiver'}</h3>

          <button
            onClick={() => { signInWithOAuth() }}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
          >
            <svg className="h-5 w-5 mr-2" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>
            Sign in with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">OR</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (isDonor && isRegistering) {
              handleDonorRegister();
            } else if (isDonor && !isRegistering) {
              handleDonorLogin();
            }else if (!isDonor && isRegistering){
              handleReceiverRegister();
            } else {
              handleReceiverLogin();
            }
          }}>
            {/* // removed onSubmit={handleAuth} */}
            {(isRegistering) ? <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            /> : ""}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-300"
            // onClick={() => {
            //   if(isDonor && isRegistering){
            //     handleDonorRegister();
            //   }else if(isDonor && !isRegistering) {
            //     handleDonorLogin();
            //   }
            //   // handleAuthe(email, password);
            //   // isDonor?navigate('/DonorDashboard'):navigate('/receiverDashboard');
            // }}
            >
              {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-300"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;