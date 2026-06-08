import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

type Props = {
  images: string[];
  className?: string;
  height?: string;
  rounded?: string;
};

export const AnnouncementBannerSwiper = ({
  images,
  className = "",
  height = "h-44 sm:h-56 md:h-72",
  rounded = "rounded-2xl",
}: Props) => {
  if (!images?.length) return null;

  return (
    <div
      className={`announcement-swiper relative overflow-hidden bg-secondary/50 ${rounded} ${className}`}
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={images.length > 1}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={images.length > 1}
        className="h-full w-full"
      >
        {images.map((img, i) => (
          <SwiperSlide key={i}>
            <img
              src={img}
              alt={`banner-${i}`}
              loading="lazy"
              className={`w-full object-cover ${height}`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        .announcement-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.65);
          opacity: 1;
          width: 6px; height: 6px;
        }
        .announcement-swiper .swiper-pagination-bullet-active {
          background: hsl(var(--primary));
          width: 18px; border-radius: 9999px;
        }
        .announcement-swiper .swiper-button-next,
        .announcement-swiper .swiper-button-prev {
          color: white;
          background: rgba(0,0,0,0.35);
          width: 32px; height: 32px;
          border-radius: 9999px;
          backdrop-filter: blur(6px);
        }
        .announcement-swiper .swiper-button-next:after,
        .announcement-swiper .swiper-button-prev:after {
          font-size: 14px; font-weight: 800;
        }
      `}</style>
    </div>
  );
};
