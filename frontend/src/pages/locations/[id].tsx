import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import ScheduleItem from "@/components/schedule/ScheduleItem";
import { useSession } from "next-auth/react";
import { RotateLoader } from "react-spinners";

interface ScheduleItemType {
    cinemaId:string;
    movieId: string;
    startTime: string;
    duration: number;
}

interface ScheduleDayType {
    day: string;
    scheduleItems: [ScheduleItemType];
}

interface ScheduleType {
    day: string;
    scheduleDays: [ScheduleDayType];
}

const CINEMA_SCHEDULE = gql`
    query GET_CINEMA_SCHEDULE($cinema_id: String!){
        schedules(cinemaId:$cinema_id){
            scheduleDays{
                day
                scheduleItems {
                    movieId
                    startTime
                    duration
                }
            }
        }
    }
`

const FETCH_CINEMA = gql`
    query FETCH_CINEMA($cinema_id: String!){
        fetchCinema(cinemaId: $cinema_id){
            name
            location
        }
    }
`

const CinemaProfile = () => {
    const router = useRouter()
    const { id } = router.query;
    const route = `/api/auth/signin?callbackUrl=/locations/${id}`;
    const { data: session } = useSession({
        required:true,
        onUnauthenticated() {
            router.push(route)
        },
    })
    const cinemaId = id as string;
    
    const {data, loading} = useQuery(CINEMA_SCHEDULE, {
        variables: {
            cinema_id:cinemaId
        },
        skip: !cinemaId,
    })
    const {data:cinemeData} = useQuery(FETCH_CINEMA, {
        variables: {
            cinema_id:cinemaId
        },
        skip: !cinemaId,
    })

    if(loading) return
      <div className='absolute top-1/2 left-1/2 right-1/2 bottom-1/2'>
          <RotateLoader
            loading={true}
            margin={2}
            color='#57ffc7'
            size={10}
            speedMultiplier={1}
          />
      </div>

    return (
        <div>
            <h1 className="text-center text-2xl dark:text-white pt-4">{cinemeData?.fetchCinema.name}</h1><h2 className="text-center text-xl dark:text-white pb-4">{cinemeData?.fetchCinema.location}</h2>
            <div>
                <p className="dark:text-white text-center text-lg mt-5">Current schedule</p>
                {data?.schedules.length ? (
                    data.schedules.map((schedule: ScheduleType, index: number) => (
                        <div key={index} className="flex flex-col">
                            {schedule.scheduleDays.map((scheduleDay: ScheduleDayType, dayIndex: number) => (
                            <div key={dayIndex} className="shadow-lg shadow-gray-200 dark:shadow-sm dark:shadow-gray-600 h-auto w-full p-4 mb-4">
                                <h5 className="text-lg font-bold mb-2 dark:text-white">{scheduleDay.day}</h5>
                                <ul>
                                    {scheduleDay.scheduleItems.map((item: ScheduleItemType, itemIndex: number) => (
                                        <li key={itemIndex} className="mb-2">
                                            { id && (
                                                <ScheduleItem cinemaId={cinemaId} day={scheduleDay.day} movieId={item.movieId} startTime={item.startTime} />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <p className="ms-5 text-red-500 font-bold">No movies to be shown</p>
                )}
            </div>
        </div>
    )
}

export default CinemaProfile;